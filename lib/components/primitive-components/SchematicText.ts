import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicTextProps } from "@tscircuit/props"

export class SchematicText extends PrimitiveComponent<
  typeof schematicTextProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicText",
      zodProps: schematicTextProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    db.schematic_text.insert({
      anchor: props.anchor ?? "center",
      text: props.text,
      font_size: props.fontSize,
      color: props.color || "#000000",
      position: {
        x: props.schX ?? 0,
        y: props.schY ?? 0,
      },
      rotation: props.schRotation ?? 0,
    })
  }
}
