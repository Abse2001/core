import type { SchematicPinStyle } from "@tscircuit/props"
import { z } from "zod"
import { parsePinNumberFromLabelsOrThrow } from "../utils/schematic/parsePinNumberFromLabelsOrThrow"

/**
 * `schematic_component` from `circuit-json` brings in very heavy types which
 * cause TypeScript's type checker to run out of memory. We only need the shape
 * for the `pin_styles` object here, so we define a lightweight replacement.
 */
type UnderscorePinStyles = Record<
  string,
  {
    bottom_margin?: number
    left_margin?: number
    right_margin?: number
    top_margin?: number
  }
>

export const underscorifyPinStyles = (
  pinStyles: Record<string, SchematicPinStyle> | undefined,
  pinLabels?: Record<string, string[] | string> | null,
): UnderscorePinStyles | undefined => {
  if (!pinStyles) return undefined
  const underscorePinStyles: UnderscorePinStyles = {}
  const mergedStyles: Record<number, SchematicPinStyle> = {}

  // First pass: collect all styles by pin number
  for (const [pinNameOrLabel, pinStyle] of Object.entries(pinStyles) as Array<
    [string, SchematicPinStyle]
  >) {
    const pinNumber = parsePinNumberFromLabelsOrThrow(pinNameOrLabel, pinLabels)

    // Merge with existing styles for this pin
    mergedStyles[pinNumber] = {
      ...mergedStyles[pinNumber],
      ...pinStyle,
    }
  }

  // Second pass: convert to underscore format
  for (const [pinNumber, pinStyle] of Object.entries(mergedStyles)) {
    const pinKey = `pin${pinNumber}`
    underscorePinStyles[pinKey] = {
      bottom_margin: pinStyle.bottomMargin as number,
      left_margin: pinStyle.leftMargin as number,
      right_margin: pinStyle.rightMargin as number,
      top_margin: pinStyle.topMargin as number,
    }
  }

  return underscorePinStyles
}
