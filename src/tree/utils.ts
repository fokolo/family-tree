import { NODE_WIDTH, SPACING } from "./constants";
import { Generation, OTHERS_GENERATION, RelationTypes } from "./types";

export const isOddModifer = (i: number) => (i % 2 === 0 ? 1 : -1);
export const calcX = (i: number) => (((NODE_WIDTH + SPACING) * (i + (i % 2))) / 2) * isOddModifer(i);
export const calcCoupleEdgeYOffset = (i: number) => ((i + (i % 2)) / 2) * isOddModifer(i);

export const getGenerationFromRelation = (relation: RelationTypes): Generation => {
    switch (relation) {
        case "Grandparent":
        case "Grandparent (maybe step)":
            return 2;
        case "Uncle/aunt":
        case "Uncle/aunt (maybe step)":
        case "Parent":
        case "Parent (maybe step)":
        case "Step parent":
        case "Adoptive parent":
        case "Parent in law":
            return 1;
        case "Partner":
        case "Sibling":
        case "Sibling (maybe step)":
        case "Have shared kids":
        case "Sibling in law":
        case "Divorcee":
        case "Common-Law Partner":
        case "Cousin":
        case "Step sibling":
        case "Cousin (maybe step)":
            return 0;
        case "Child":
        case "Child (maybe step)":
        case "Child in law":
        case "Nephew/niece":
        case "Nephew/niece (maybe step)":
        case "Step child":
        case "Adopted child":
            return -1;
        case "Grandchild (maybe step)":
        case "Grandchild":
            return -2;
        case "Relative":
            return OTHERS_GENERATION;
    }
};

export const isRelationSharingKids = (relation: RelationTypes) => {
    return (
        relation === "Partner" ||
        relation === "Have shared kids" ||
        relation === "Divorcee" ||
        relation === "Common-Law Partner"
    );
};

export const isRelationAChild = (relation: RelationTypes) => {
    return (
        relation == "Child" ||
        relation == "Child (maybe step)" ||
        relation == "Child in law" ||
        relation == "Step child" ||
        relation == "Adopted child"
    );
};
