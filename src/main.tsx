import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ReactFlowProvider } from "reactflow";
import { RawFamilyMember, buildFamilyAndRelations, RawFamilyRelation } from "./utils.ts";
import rawFamily from "../tests/family1.json";
import { FamilyTree } from "./FamilyTree.tsx";
import "reactflow/dist/style.css";

declare global {
    interface Window {
        showTree: (
            element: HTMLElement,
            familyMembers: RawFamilyMember[],
            familyRelations: RawFamilyRelation[],
            rootId: string | null
        ) => void;
        showDefaultTree: () => void;
    }
}

window.showTree = (
    element: HTMLElement,
    familyMembers: RawFamilyMember[],
    familyRelations: RawFamilyRelation[],
    rootId: string | null
) => {
    const [familyMembersRecord, familyRelationsRecord] = buildFamilyAndRelations(
        familyMembers as RawFamilyMember[],
        familyRelations as RawFamilyRelation[]
    );
    const rootMember = rootId ? familyMembersRecord[rootId] : Object.values(familyMembersRecord)[0];

    ReactDOM.createRoot(element).render(
        <React.StrictMode>
            <ReactFlowProvider>
                <ReactFlowProvider>
                    <div style={{ height: "100vh", width: "100vw" }}>
                        <FamilyTree
                            familyMembers={familyMembersRecord}
                            familyRelations={familyRelationsRecord}
                            rootMember={rootMember}
                        />
                    </div>
                </ReactFlowProvider>
            </ReactFlowProvider>
        </React.StrictMode>
    );
};

window.showTree(
    document.getElementById("root")!,
    rawFamily.familyMembers as RawFamilyMember[],
    rawFamily.familyRelations as RawFamilyRelation[],
    "3"
);
