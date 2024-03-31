import { describe, test, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("My test", async () => {
  await setup();

  test("my test", async () => {
    const html = await $fetch("/");
    expect(html).toContain(
      "A communal board for DIY events all around RVA; queer, radical, and STINKY!!!"
    );
  });
});
