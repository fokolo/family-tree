import { Node } from "reactflow";
import { FamilyMemberNodeData } from "./FamilyComponents/FamilyMemberNode";
import { FamilyMember, FamilyMembers, FamilyRelations, RelationTypes } from "./tree/types";

export type RawFamilyMember = {
    id: string;
    data: {
        badges: {
            bgColor: string;
            label: string;
            textColor: string;
        }[];
        sex: "M" | "F";
        subtitles: string[];
        title: string;
        titleBgColor: string;
        titleTextColor: string;
        imageUrl?: string | null;
    };
};

export type RawFamilyRelation = {
    fromId: string;
    toId: string;
    relationType: RelationTypes;
    prettyType: string;
    isInnerFamily: boolean;
};

export function buildFamilyAndRelations(rawFamily: RawFamilyMember[], rawRelation: RawFamilyRelation[]) {
    const familyMembers: FamilyMembers = Object.fromEntries(
        rawFamily.map((rawMember) => {
            return [
                rawMember.id,
                {
                    id: rawMember.id,
                    data: {
                        badges: rawMember.data.badges,
                        sex: rawMember.data.sex,
                        imageUrl: rawMember.data.imageUrl,
                        subtitles: rawMember.data.subtitles,
                        title: rawMember.data.title,
                        titleBgColor: rawMember.data.titleBgColor,
                        titleTextColor: rawMember.data.titleTextColor
                    }
                }
            ] as [string, FamilyMember];
        })
    );

    const familyRelations: FamilyRelations = Object.fromEntries(
        rawRelation.map((rawMember) => {
            const id = `${rawMember.fromId}-${rawMember.toId}`;
            return [
                id,
                {
                    id,
                    to: rawMember.fromId,
                    from: rawMember.toId,
                    relationType: rawMember.relationType,
                    prettyType: rawMember.prettyType,
                    isInnerFamily: rawMember.isInnerFamily
                }
            ];
        })
    );

    return [familyMembers, familyRelations] as const;
}
export function nodeColorForMinimap(node: Node<FamilyMemberNodeData>) {
    return node.data.titleBgColor;
}
