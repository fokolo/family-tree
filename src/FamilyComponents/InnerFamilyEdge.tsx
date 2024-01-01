import uniqBy from "lodash/uniqBy";
import { BaseEdge, EdgeProps, getSmoothStepPath, Position, useStore } from "reactflow";
import { EDGE_XGAP_MODIFIER, NODE_HEIGHT } from "../tree/constants";
import { useCallback } from "react";

export type InnerFamilyEdgeData = {
    offsetY: number;
    familyIndex: number;
};

export type InnerFamilyEdgeProps = EdgeProps<InnerFamilyEdgeData>;
export const InnerFamilyTypeKey = "innerFamily";

export default function InnerFamilyEdge({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    data
}: InnerFamilyEdgeProps) {
    const edges = useStore((store) =>
        uniqBy(
            store.edges.filter((edge) => edge.source == source),
            "data.familyIndex"
        )
    );
    const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

    const hiddenOffset = targetNode?.data?.isHidden ? NODE_HEIGHT / 2 : 0;

    const [edgePath] = getSmoothStepPath({
        sourceX: sourceX - edges.findIndex((edge) => edge.data.familyIndex == data?.familyIndex) * EDGE_XGAP_MODIFIER,
        sourceY,
        sourcePosition: Position.Bottom,
        targetX,
        targetY,
        targetPosition: Position.Top,
        centerY: targetY - (data?.offsetY ?? 0) - hiddenOffset
    });

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style} />
        </>
    );
}
