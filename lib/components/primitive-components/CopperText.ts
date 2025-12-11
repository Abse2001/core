import { copperTextProps } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import { length } from "circuit-json"
import { normalizeTextForCircuitJson } from "lib/utils/normalizeTextForCircuitJson"
import { decomposeTSR } from "transformation-matrix"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

const copperTextPropsWithKnockout = copperTextProps.extend({
  isKnockout: z.boolean().optional(),
  isMirrored: z.boolean().optional(),
  knockoutPadding: z
    .object({
      left: length,
      right: length,
      top: length,
      bottom: length,
    })
    .partial()
    .optional(),
})

export class CopperText extends PrimitiveComponent<
  typeof copperTextPropsWithKnockout
> {
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CopperText",
      zodProps: copperTextPropsWithKnockout,
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
    const isKnockout = props.isKnockout ?? false
    const knockoutPadding = {
      left: props.knockoutPadding?.left ?? 0.2,
      right: props.knockoutPadding?.right ?? 0.2,
      top: props.knockoutPadding?.top ?? 0.2,
      bottom: props.knockoutPadding?.bottom ?? 0.2,
    }

    if (isFlipped) {
      rotation = (rotation + 180) % 360
    }

    for (const layer of layerOptions) {
      const flippedLayer = maybeFlipLayer(layer)
      const textIsMirrored = props.isMirrored ?? flippedLayer === "bottom"
      const textRotation =
        flippedLayer === "bottom" && !isFlipped
          ? (rotation + 180) % 360
          : rotation

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
        ccw_rotation: textRotation,
        pcb_component_id: pcbComponentId,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: group?.pcb_group_id ?? undefined,
        is_knockout: isKnockout,
        knockout_padding: knockoutPadding,
        is_mirrored: textIsMirrored,
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
