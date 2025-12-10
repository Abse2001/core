import { cju } from "@tscircuit/circuit-json-util"
import type { CircuitJson } from "circuit-json"
import type { Group } from "../../components/primitive-components/Group/Group"
import type { SubcircuitI } from "../../components/primitive-components/Group/Subcircuit/SubcircuitI"
import type {
  InflatorContext,
  SourceGroupId,
} from "../../components/primitive-components/Group/Subcircuit/InflatorFn"
import { inflatePcbBoard } from "../../components/primitive-components/Group/Subcircuit/inflators/inflatePcbBoard"
import { inflateSourceCapacitor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceCapacitor"
import { inflateSourceChip } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceChip"
import { inflateSourceDiode } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceDiode"
import { inflateSourceGroup } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceGroup"
import { inflateSourceInductor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceInductor"
import { inflateSourcePort } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourcePort"
import { inflateSourceResistor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceResistor"
import { inflateSourceTrace } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceTrace"
import { inflateSourceTransistor } from "../../components/primitive-components/Group/Subcircuit/inflators/inflateSourceTransistor"
import { identity } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"

export const inflateCircuitJson = (
  target: SubcircuitI & Group<any>,
  circuitJson: CircuitJson | undefined,
  children: any[],
) => {
  if (!circuitJson) return
  const injectionDb = cju(circuitJson)

  if (circuitJson && children?.length > 0) {
    throw new Error("Component cannot have both circuitJson and children")
  }

  const groupsMap = new Map<SourceGroupId, Group<any>>()

  const inflationCtx: InflatorContext = {
    injectionDb,
    subcircuit: target,
    groupsMap,
  }

  const sourceGroups = injectionDb.source_group.list()
  for (const sourceGroup of sourceGroups) {
    inflateSourceGroup(sourceGroup, inflationCtx)
  }

  const pcbBoards = injectionDb.pcb_board.list()
  for (const pcbBoard of pcbBoards) {
    inflatePcbBoard(pcbBoard, inflationCtx)
  }

  const sourceComponents = injectionDb.source_component.list()
  for (const sourceComponent of sourceComponents) {
    switch (sourceComponent.ftype) {
      case "simple_resistor":
        inflateSourceResistor(sourceComponent, inflationCtx)
        break
      case "simple_capacitor":
        inflateSourceCapacitor(sourceComponent, inflationCtx)
        break
      case "simple_inductor":
        inflateSourceInductor(sourceComponent, inflationCtx)
        break
      case "simple_diode":
        inflateSourceDiode(sourceComponent, inflationCtx)
        break
      case "simple_chip":
        inflateSourceChip(sourceComponent, inflationCtx)
        break
      case "simple_transistor":
        inflateSourceTransistor(sourceComponent, inflationCtx)
        break
      default:
        throw new Error(
          `No inflator implemented for source component ftype: "${sourceComponent.ftype}"`,
        )
    }
  }

  const sourcePorts = injectionDb.source_port.list()
  for (const sourcePort of sourcePorts) {
    inflateSourcePort(sourcePort, inflationCtx)
  }

  const pcbTraces = injectionDb.pcb_trace.list()
  if (pcbTraces.length > 0) {
    const parentTransform =
      target._computePcbGlobalTransformBeforeLayout?.() ?? identity()
    const maybeFlipLayer =
      target._getPcbPrimitiveFlippedHelpers?.().maybeFlipLayer ??
      ((layer: string) => layer)

    for (const pcbTrace of pcbTraces) {
      const { type: _ignoredType, ...traceWithoutType } = pcbTrace
      const targetSubcircuitId =
        target.getSubcircuit?.()?.subcircuit_id ??
        target.subcircuit_id ??
        traceWithoutType.subcircuit_id ??
        (target.source_group_id
          ? `subcircuit_${target.source_group_id}`
          : undefined)
      inflationCtx.subcircuit.root?.db.pcb_trace.insert({
        ...traceWithoutType,
        route: pcbTrace.route.map((point) => {
          const { x, y, ...restOfPoint } = point
          const transformedPoint = applyToPoint(parentTransform, {
            x: x ?? 0,
            y: y ?? 0,
          })

          if (point.route_type === "wire" && point.layer) {
            return {
              ...restOfPoint,
              ...transformedPoint,
              layer: maybeFlipLayer(point.layer),
            }
          }

          return { ...restOfPoint, ...transformedPoint }
        }),
        subcircuit_id: targetSubcircuitId ?? traceWithoutType.subcircuit_id,
      })
    }
    return
  }

  const sourceTraces = injectionDb.source_trace.list()
  for (const sourceTrace of sourceTraces) {
    inflateSourceTrace(sourceTrace, inflationCtx)
  }
}
