import { FamilyMemberNode } from "../FamilyComponents/FamilyMemberNode";
import { buildEdgeId } from "./buildEdges";
import { GENERATION_HEIGHT, MAX_IN_ROW, NODE_HEIGHT, NODE_WIDTH, SPACING } from "./constants";
import {
    FamilyMember,
    FamilyMembers,
    FamilyRelations,
    GenerationsPossible,
    InnerFamily,
    OTHERS_GENERATION
} from "./types";
import { calcX } from "./utils";

function calcNodeXPosition(spacing: number, nodeWidth: number, isSmall?: boolean) {
    if (isSmall) {
        return 15 + spacing * 0.5;
    }
    return spacing * 0.5 + nodeWidth;
}

export function positionUnknownGeneration(otherGenerationNodes?: FamilyMember[]) {
    if (!otherGenerationNodes) {
        return [];
    }

    const unknownGenerationNodes = otherGenerationNodes.map((node, i) => {
        const x = calcX(i % MAX_IN_ROW);
        const y = OTHERS_GENERATION * -(GENERATION_HEIGHT + NODE_HEIGHT);
        const othersY = y - Math.floor(i / MAX_IN_ROW) * (NODE_HEIGHT + GENERATION_HEIGHT) * 0.7;
        return buildNodeFromFamilyMember(node, x, othersY);
    });

    return unknownGenerationNodes;
}

function sumParentsSize(couple: InnerFamily, familyMembers: FamilyMembers) {
    return couple.parents
        .map((parent) => calcNodeXPosition(SPACING, NODE_WIDTH, familyMembers[parent].data.isHidden))
        .reduce((acc, cur) => acc + cur, 0);
}

export function positionAndBuildFamilyTree(
    innerFamiliesPerGeneration: Record<string, InnerFamily[]>,
    familyMembers: FamilyMembers
) {
    const familySizeRecurse = (couple: InnerFamily): number => {
        const coupleSize = sumParentsSize(couple, familyMembers);
        if (couple.children.length === 0) {
            couple.width = coupleSize;
            return couple.width;
        }
        const childrenSize = couple.children.map(familySizeRecurse).reduce((a, b) => a + b, 0);

        couple.width = Math.max(coupleSize, childrenSize);
        return couple.width;
    };

    for (const currentGeneration of GenerationsPossible) {
        const couplesInCurrentGeneration = innerFamiliesPerGeneration[currentGeneration];
        if (!couplesInCurrentGeneration || couplesInCurrentGeneration.length === 0) {
            continue;
        }

        const nonSizeCalculatedCouples = couplesInCurrentGeneration.filter((couple) => !couple.width);
        nonSizeCalculatedCouples.forEach(familySizeRecurse);
    }

    const familyCenterPositionRecurse = (couple: InnerFamily): void => {
        let currentPosition = couple.centerX ?? 0;
        couple.centerX = currentPosition;
        const coupleSize = couple.width ?? 0;
        currentPosition -= coupleSize / 2;
        if (!coupleSize) {
            console.error("couple width is undefined");
            return;
        }

        couple.children.forEach((child) => {
            child.centerX = currentPosition + (child.width ?? 0) / 2;
            currentPosition += child.width ?? 0;
            familyCenterPositionRecurse(child);
        });
    };

    for (const currentGeneration of GenerationsPossible) {
        const couplesInCurrentGeneration = innerFamiliesPerGeneration[currentGeneration];
        if (!couplesInCurrentGeneration || couplesInCurrentGeneration.length === 0) {
            continue;
        }

        const nonCenterPositionedCouples = couplesInCurrentGeneration.filter((couple) => couple.centerX === undefined);
        const couplesWithCenterPosition = couplesInCurrentGeneration.filter((couple) => couple.centerX !== undefined);

        let currentPosition = 0;

        if (couplesWithCenterPosition.length > 0) {
            const maxCenterPositionCouple = couplesWithCenterPosition.reduce((a, b) =>
                (a.centerX ?? 0) > (b.centerX ?? 0) ? a : b
            );

            currentPosition = (maxCenterPositionCouple.centerX ?? 0) + (maxCenterPositionCouple.width ?? 0) / 2;
        } else if (couplesWithCenterPosition.length === 0) {
            const currentSpaceRowWidth = nonCenterPositionedCouples.reduce((a, b) => a + (b.width ?? 0), 0);
            currentPosition -= currentSpaceRowWidth / 2;
        }

        nonCenterPositionedCouples.forEach((couple) => {
            couple.centerX = currentPosition + (couple.width ?? 0) / 2;
            currentPosition += couple.width ?? 0;
        });
        nonCenterPositionedCouples.forEach(familyCenterPositionRecurse);
    }

    const familyTreeCreateNodesRecurse = (couple: InnerFamily): FamilyMemberNode[] => {
        const centerPosition = couple.centerX ?? 0;
        const width = sumParentsSize(couple, familyMembers);
        couple.couplePainted = true;

        const parentsFamilyMembers = couple.parents
            .map((parentId) => {
                const node = familyMembers[parentId];
                if (!node) {
                    console.error("node not found");
                    return;
                }
                return node;
            })
            .filter((parent): parent is FamilyMember => !!parent);

        let currentPosition = centerPosition - width / 2;
        const positionedNodesOfCouples: FamilyMemberNode[] = [...parentsFamilyMembers].map((parent) => {
            const x = currentPosition + calcNodeXPosition(SPACING, NODE_WIDTH) / 2;
            currentPosition += calcNodeXPosition(SPACING, NODE_WIDTH);
            const yOffset = parent.data.isHidden ? NODE_HEIGHT / 2 : 0;
            const y = couple.generation * (GENERATION_HEIGHT + NODE_HEIGHT) + yOffset;
            return buildNodeFromFamilyMember(parent, x, y);
        });

        const nodesOfChildren = couple.children.flatMap(familyTreeCreateNodesRecurse);

        return [...positionedNodesOfCouples, ...nodesOfChildren].flat();
    };

    const familyNodes: FamilyMemberNode[] = [];
    for (const currentGeneration of GenerationsPossible) {
        const couplesInCurrentGeneration = innerFamiliesPerGeneration[currentGeneration];
        if (!couplesInCurrentGeneration || couplesInCurrentGeneration.length === 0) {
            continue;
        }

        const nonPaintedCouples = couplesInCurrentGeneration.filter((couple) => !couple.couplePainted);

        familyNodes.push(...nonPaintedCouples.flatMap(familyTreeCreateNodesRecurse));
    }

    return familyNodes;
}

function buildNodeFromFamilyMember(parent: FamilyMember, x: number, y: number): FamilyMemberNode {
    return {
        id: parent.id,
        data: {
            ...parent.data
        },
        type: "familyMember",
        position: {
            y,
            x
        }
    };
}

export function addNodeVisibilityCallback(
    nodes: FamilyMemberNode[],
    hiddenNodeIds: string[],
    setHiddenNodeIds: (newIds: string[]) => void
) {
    return nodes.map((node) => {
        return {
            ...node,
            data: {
                ...node.data,
                onVisibilityChange: (isVisible: boolean) => {
                    const newHiddenNodes = isVisible
                        ? hiddenNodeIds.filter((id) => id != node.id)
                        : [...hiddenNodeIds, node.id];
                    setHiddenNodeIds(newHiddenNodes);
                }
            }
        };
    });
}

export function addNodeSelection(
    familyRelations: FamilyRelations,
    nodes: FamilyMemberNode[],
    selectedNodeId: string | null
) {
    return nodes.map((node) => {
        if (!selectedNodeId) return node;

        if (node.id == selectedNodeId) {
            return {
                ...node,
                data: {
                    ...node.data,
                    isRoot: true
                }
            };
        }

        return {
            ...node,
            data: {
                ...node.data,
                relationToSelected: familyRelations[buildEdgeId(selectedNodeId, node.id)]?.prettyType
            }
        };
    });
}
