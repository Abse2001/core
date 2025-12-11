import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CopperText rendering", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <coppertext
        text="Copper Layer Text"
        pcbX={1.2}
        pcbY={3.4}
        fontSize={0.25}
        layer="top"
        anchorAlignment="center"
      />
    </board>,
  )

  project.render()

  const copperTexts = project.db.pcb_copper_text.list()

  expect(copperTexts.length).toBe(1)
  expect(copperTexts[0].text).toBe("Copper Layer Text")
  expect(copperTexts[0].anchor_position.x).toBeCloseTo(1.2)
  expect(copperTexts[0].anchor_position.y).toBeCloseTo(3.4)
  expect(copperTexts[0].font_size).toBeCloseTo(0.25)
  expect(copperTexts[0].anchor_alignment).toBe("center")
  expect(copperTexts[0].is_knockout).toBe(false)
  expect(copperTexts[0].is_mirrored).toBe(false)
  expect(copperTexts[0].knockout_padding?.left).toBeCloseTo(0.2)

  expect(project).toMatchPcbSnapshot(import.meta.path)
})

test("CopperText supports knockout padding overrides", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="5mm" height="5mm">
      <coppertext
        text="Knockout Text"
        pcbX={1}
        pcbY={1}
        layer="top"
        isKnockout
        knockoutPadding={{ left: 0.3, right: 0.4, top: 0.5, bottom: 0.6 }}
      />
    </board>,
  )

  project.render()

  const [copperText] = project.db.pcb_copper_text.list()

  expect(copperText.is_knockout).toBe(true)
  expect(copperText.knockout_padding?.left).toBeCloseTo(0.3)
  expect(copperText.knockout_padding?.right).toBeCloseTo(0.4)
  expect(copperText.knockout_padding?.top).toBeCloseTo(0.5)
  expect(copperText.knockout_padding?.bottom).toBeCloseTo(0.6)
})

test("CopperText mirrors when placed on the bottom layer", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="5mm" height="5mm">
      <coppertext text="Bottom Layer" pcbX={2} pcbY={2} layer="bottom" />
    </board>,
  )

  project.render()

  const [copperText] = project.db.pcb_copper_text.list()

  expect(copperText.layer).toBe("bottom")
  expect(copperText.is_mirrored).toBe(true)
  expect(copperText.ccw_rotation).toBeCloseTo(180)
})
