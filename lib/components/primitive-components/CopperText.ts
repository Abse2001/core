import { copperTextProps } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class CopperText extends PrimitiveComponent<typeof copperTextProps> {
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CopperText",
      zodProps: copperTextProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    const root = this.root
    if (!root || root.pcbDisabled) return
    const { db } = root
    const { _parsedProps: props } = this
    const container = this.getPrimitiveContainer()
    const pcbComponentId =
      this.parent?.pcb_component_id ??
      container?.pcb_component_id ??
      this.getParentNormalComponent()?.pcb_component_id

    if (!pcbComponentId) {
      this.renderError("CopperText must be placed within a PCB component")
      return
    }

    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer, isFlipped } = this._getPcbPrimitiveFlippedHelpers()
    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()

    let rotation = 0

    if (props.pcbRotation !== undefined && props.pcbRotation !== 0) {
      rotation = props.pcbRotation
    } else {
      const globalTransform = this._computePcbGlobalTransformBeforeLayout()
      const decomposedTransform = decomposeTSR(globalTransform)
      rotation = (decomposedTransform.rotation.angle * 180) / Math.PI
    }

    if (isFlipped) {
      rotation = (rotation + 180) % 360
    }

    const layerOptions = new Set<LayerRef>()

    for (const layer of props.layers ?? []) {
      layerOptions.add(layer)
    }

    if (props.layer) {
      layerOptions.add(props.layer)
    }

    if (layerOptions.size === 0) {
      layerOptions.add("top")
    }

    const fontSize = props.fontSize ?? 0.2
    const text = normalizeTextForCircuitJson(props.text)

    for (const layer of layerOptions) {
      const flippedLayer = maybeFlipLayer(layer)

      db.pcb_copper_text.insert({
        anchor_alignment: props.anchorAlignment ?? "center",
        anchor_position: {
          x: position.x,
          y: position.y,
        },
        font: props.font ?? "tscircuit2024",
        font_size: fontSize,
        layer: flippedLayer,
        text,
        ccw_rotation: rotation,
        pcb_component_id: pcbComponentId,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: group?.pcb_group_id ?? undefined,
        is_knockout: false,
        knockout_padding: {
          left: 0.2,
          right: 0.2,
          top: 0.2,
          bottom: 0.2,
        },
        is_mirrored: false,
      })
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    const fontSize = props.fontSize ?? 0.2
    const textLength = props.text.length
    const width = textLength * fontSize
    const height = fontSize

    return { width, height }
  }
}
