export type ParentsChildrens = {
    parentA: string;
    parentB: string;
    children: string[];
};

export type RelationTypes =
    | "Sibling"
    | "Sibling (maybe step)"
    | "Nephew/niece"
    | "Nephew/niece (maybe step)"
    | "Child"
    | "Child (maybe step)"
    | "Cousin"
    | "Cousin (maybe step)"
    | "Partner"
    | "Step child"
    | "Step sibling"
    | "Adopted child"
    | "Have shared kids"
    | "Sibling in law"
    | "Divorcee"
    | "Uncle/aunt"
    | "Uncle/aunt (maybe step)"
    | "Parent"
    | "Parent (maybe step)"
    | "Step parent"
    | "Adoptive parent"
    | "Parent in law"
    | "Child in law"
    | "Common-Law Partner"
    | "Grandchild"
    | "Grandchild (maybe step)"
    | "Grandparent"
    | "Grandparent (maybe step)"
    | "Relative";

export type FamilyRelation = {
    id: string;
    from: string;
    to: string;
    relationType: RelationTypes;
    prettyType: string;
    isInnerFamily: boolean;
};

export type BadgeData = {
    bgColor: string;
    label: string;
    textColor: string;
};

export type FamilyMember = {
    id: string;
    data: {
        badges: {
            bgColor: string;
            label: string;
            textColor: string;
        }[];
        title: string;
        titleBgColor: string;
        titleTextColor: string;
        sex: "M" | "F";
        subtitles: string[];
        isHidden: boolean;
        imageUrl?: string;
        onVisibilityChange: (isVisible: boolean) => void;
    };
};

export type FamilyMembers = Record<string, FamilyMember>;
export type FamilyRelations = Record<string, FamilyRelation>;

export type InnerFamily = {
    parents: string[];
    children: InnerFamily[];
    generation: Generation;
    width?: number;
    centerX?: number;
    couplePainted?: boolean;
};

export const GenerationsPossible = [-2, -1, 0, 1, 2] as const;
export const OTHERS_GENERATION = 3;
export type Generation = (typeof GenerationsPossible)[number] | typeof OTHERS_GENERATION;
