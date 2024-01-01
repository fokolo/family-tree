import { buildEdgeId } from "./buildEdges";
import {
    FamilyMember,
    FamilyMembers,
    FamilyRelations,
    Generation,
    InnerFamily,
    OTHERS_GENERATION,
    GenerationsPossible,
    ParentsChildrens,
    FamilyRelation
} from "./types";
import { getGenerationFromRelation, isRelationAChild, isRelationSharingKids } from "./utils";

function tryInferGenerationForOthers(
    familyMemberByGeneration: [Generation, FamilyMember][],
    familyRelations: FamilyRelations
): [Generation, FamilyMember][] {
    const others: FamilyMember[] = familyMemberByGeneration
        .filter(([gen]) => gen == OTHERS_GENERATION)
        .map(([, member]) => member);
    const zeroGen: FamilyMember[] = familyMemberByGeneration.filter(([gen]) => gen == 0).map(([, member]) => member);

    return others.map((othersMember) => {
        const relationsFromZeroGeneration = zeroGen.map(
            (relative) => familyRelations[buildEdgeId(othersMember.id, relative.id)]?.relationType
        );
        const generationsFromZeroGeneration = relationsFromZeroGeneration.map((relation) =>
            getGenerationFromRelation(relation)
        );
        const nonOthersGenerationsPossible = generationsFromZeroGeneration.filter(
            (generation) => generation !== null && generation != OTHERS_GENERATION
        );

        const newInfferedGeneration = nonOthersGenerationsPossible.every(
            (gen) => gen == nonOthersGenerationsPossible[0]
        )
            ? nonOthersGenerationsPossible[0]
            : OTHERS_GENERATION;

        return [newInfferedGeneration, othersMember];
    });
}

export function buildGenerations(
    familyMembers: FamilyMembers,
    familyRelations: FamilyRelations,
    rootId: string
): Record<Generation, FamilyMember[]> {
    const familyMembersByGeneration: [Generation, FamilyMember][] = Object.values(familyMembers).map((member) => {
        if (member.id == rootId) return [0, member];

        const relationToRootId = `${member.id}-${rootId}`;
        const relationToRoot = familyRelations[relationToRootId]?.relationType;

        if (relationToRoot) {
            const generation: Generation = getGenerationFromRelation(relationToRoot);

            return [generation, member];
        }

        return [OTHERS_GENERATION, member];
    });

    const inferredOtherGen = tryInferGenerationForOthers(familyMembersByGeneration, familyRelations);
    const membersByGenFull = [
        ...familyMembersByGeneration.filter(([gen]) => gen != OTHERS_GENERATION),
        ...inferredOtherGen
    ];

    const reducedFamilyMembersByGeneration = membersByGenFull.reduce(
        (obj, member) => {
            const [generation, memberData] = member;

            if (!obj[generation]) obj[generation] = [memberData];
            else obj[generation] = [...obj[generation], memberData];
            return obj;
        },
        {} as Record<Generation, FamilyMember[]>
    );

    return reducedFamilyMembersByGeneration;
}

function buildCouplesPerGeneration(
    familyGenerations: ReturnType<typeof buildGenerations>,
    familyRelations: FamilyRelations
) {
    const couplesPerGeneration = Object.fromEntries(
        Object.entries(familyGenerations).map(([rawGeneration, nodesInGeneration]) => {
            const generation: Generation = parseInt(rawGeneration) as Generation;
            const couples: InnerFamily[] = [];
            let availableNodesInGeneration = [...nodesInGeneration];

            while (availableNodesInGeneration.length > 0) {
                const node = availableNodesInGeneration.pop();
                if (!node) {
                    break;
                }

                const partnersIds = Object.values(familyRelations)
                    .filter((relation) => relation.from === node.id && isRelationSharingKids(relation.relationType))
                    .map((relation) => relation.to);
                if (partnersIds.length === 0) {
                    couples.push({ parents: [node.id], children: [], generation });
                    continue;
                }

                const partnersNodes: FamilyMember[] = partnersIds
                    .map((partnerId) => {
                        return availableNodesInGeneration.find((node) => node.id === partnerId);
                    })
                    .filter((node): node is FamilyMember => !!node);

                couples.push({
                    parents: [node.id, ...partnersNodes.map((node) => node.id)],
                    children: [],
                    generation
                });
                availableNodesInGeneration = availableNodesInGeneration.filter((node) => !partnersNodes.includes(node));
            }

            return [generation, couples] as const;
        })
    );

    return couplesPerGeneration;
}

// NOTE: this function edits couplesPerGeneration in place
function buildInnerFamilyPerCouple(
    couplesPerGeneration: ReturnType<typeof buildCouplesPerGeneration>,
    familyRelations: FamilyRelations
) {
    GenerationsPossible.forEach((generation) => {
        const couplesInCurrentGeneration = couplesPerGeneration[generation];
        if (!couplesInCurrentGeneration || couplesInCurrentGeneration.length === 0) {
            return;
        }

        const couplesInNextGeneration = couplesPerGeneration[generation + 1];
        if (!couplesInNextGeneration || couplesInNextGeneration.length === 0) {
            return;
        }

        couplesInCurrentGeneration.forEach((couple) => {
            const currentParents = couple.parents;

            const childrenRelations = Object.values(familyRelations).filter(
                (relation) => isRelationAChild(relation.relationType) && currentParents.includes(relation.to)
            );
            const childrenIds = childrenRelations.map((relation) => relation.from);

            if (childrenIds.length === 0) {
                return;
            }

            const childrenWithTheirCouples = couplesInNextGeneration
                .filter((nextGenFamilies) => {
                    return nextGenFamilies.parents.some((nextGenParent) =>
                        childrenIds.some((child) => child == nextGenParent)
                    );
                })
                .flat();

            const uniqueChildren = childrenWithTheirCouples.filter((child) => {
                return !couplesInCurrentGeneration.some((couple) => {
                    return couple.children.includes(child);
                });
            });

            couple.children = uniqueChildren
                .map((childWithFamily) => ({
                    child: childWithFamily,
                    parents: childrenRelations.filter((rel) => childWithFamily.parents.includes(rel.from)).join()
                }))
                .sort((childWithFamilyA, childWithFamilyB) =>
                    childWithFamilyA.parents.localeCompare(childWithFamilyB.parents)
                )
                .map((childWithFamily) => childWithFamily.child);
        });
    });

    return couplesPerGeneration;
}

export function buildDataStructure(
    familyGenerations: Record<Generation, FamilyMember[]>,
    familyRelations: FamilyRelations
) {
    const couplesPerGeneration = buildCouplesPerGeneration(familyGenerations, familyRelations);
    const innerFamiliesPerGeneration = buildInnerFamilyPerCouple(couplesPerGeneration, familyRelations);

    return innerFamiliesPerGeneration;
}

export function buildParentsChildrenStructs(familyMembers: FamilyMember[], familyRelations: FamilyRelation[]) {
    const parentChildrenFamilies = familyMembers
        .map((member) => {
            const parents = familyRelations
                .filter((relation) => relation.to == member.id && relation.relationType == "Parent")
                .sort();
            if (parents.length > 2) console.error(`Too many parents for ${member.id}`);

            const parentA = parents[0]?.from;
            const parentB = parents[1]?.from;
            const id = [parentA, parentB]
                .filter((parent) => !!parent)
                .sort()
                .join("-");
            return { id, child: member.id, parentA, parentB };
        })
        .filter((childWithParents) => !!childWithParents.id)
        .reduce(
            (parentsWithAllChildren, childWithParents) => {
                if (parentsWithAllChildren[childWithParents.id]) {
                    parentsWithAllChildren[childWithParents.id].children.push(childWithParents.child);
                } else {
                    parentsWithAllChildren[childWithParents.id] = {
                        parentA: childWithParents.parentA,
                        parentB: childWithParents.parentB,
                        children: [childWithParents.child]
                    };
                }

                return parentsWithAllChildren;
            },
            {} as Record<string, ParentsChildrens>
        );

    return Object.values(parentChildrenFamilies);
}
