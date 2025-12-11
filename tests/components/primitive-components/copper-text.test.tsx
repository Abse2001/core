import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CopperText supports knockout padding and mirroring on one board", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="12mm" height="12mm">
      <coppertext
        text="Copper Layer Text"
        pcbX={1.2}
        pcbY={3.4}
        fontSize={0.25}
        layer="top"
        anchorAlignment="center"
      />

      <coppertext
        text="Knockout Text"
        pcbX={5}
        pcbY={5}
        layer="top"
        isKnockout
        knockoutPadding={{ left: 0.3, right: 0.4, top: 0.5, bottom: 0.6 }}
      />

      <coppertext text="Bottom Layer" pcbX={9} pcbY={2} layer="bottom" />
    </board>,
  )

  project.render()

  const copperTexts = project.db.pcb_copper_text.list()

  expect(copperTexts.length).toBe(3)

  const baseText = copperTexts.find(({ text }) => text === "Copper Layer Text")
  const knockoutText = copperTexts.find(({ text }) => text === "Knockout Text")
  const bottomText = copperTexts.find(({ text }) => text === "Bottom Layer")

  expect(baseText?.anchor_position.x).toBeCloseTo(1.2)
  expect(baseText?.anchor_position.y).toBeCloseTo(3.4)
  expect(baseText?.font_size).toBeCloseTo(0.25)
  expect(baseText?.anchor_alignment).toBe("center")
  expect(baseText?.is_knockout).toBe(false)
  expect(baseText?.is_mirrored).toBe(false)
  expect(baseText?.knockout_padding?.left).toBeCloseTo(0.2)

  expect(knockoutText?.is_knockout).toBe(true)
  expect(knockoutText?.knockout_padding?.left).toBeCloseTo(0.3)
  expect(knockoutText?.knockout_padding?.right).toBeCloseTo(0.4)
  expect(knockoutText?.knockout_padding?.top).toBeCloseTo(0.5)
  expect(knockoutText?.knockout_padding?.bottom).toBeCloseTo(0.6)

  expect(bottomText?.layer).toBe("bottom")
  expect(bottomText?.is_mirrored).toBe(true)
  expect(bottomText?.ccw_rotation).toBeCloseTo(180)

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
