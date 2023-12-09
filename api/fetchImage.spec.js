import { afterEach, describe, expect, it, vi } from "vitest";
import fetchImage from "./fetchImage";

const { get, head } = vi.hoisted(() => ({
  get: vi.fn(),
  head: vi.fn(),
}));

vi.mock("axios", () => ({ default: { get, head } }));

const request = { query: {} };

const response = {
  send: vi.fn(),
  setHeader: vi.fn(),
  status: vi.fn().mockReturnThis(),
};

describe("fetchImage", () => {
  afterEach(vi.clearAllMocks);

  it("returns HTTP 413 if the content is too large", async () => {
    head.mockResolvedValueOnce({
      headers: { "content-length": Number.POSITIVE_INFINITY },
    });

    await fetchImage(request, response);

    expect(response.status).toHaveBeenCalledWith(413);
    expect(response.send).toHaveBeenCalledOnce();
  });

  it("returns HTTP 400 if the content is not an image", async () => {
    head.mockResolvedValueOnce({ headers: { "content-length": 1 } });
    get.mockResolvedValueOnce({ headers: { "content-type": "" } });

    await fetchImage(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledOnce();
  });

  it("returns content if the content is a small image", async () => {
    head.mockResolvedValueOnce({ headers: { "content-length": 1 } });
    get.mockResolvedValueOnce({
      data: [],
      headers: { "content-type": "image/png" },
    });

    await fetchImage(request, response);

    expect(response.send.mock.lastCall.pop()).toBeInstanceOf(Buffer);
  });
});
