import { H3Event } from "h3";
import axios from "axios";

export default eventHandler(async (event: H3Event) => {
  const { url } = getQuery(event);

  if (typeof url !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "URL should be a string",
    });
  }

  // Check the size of the image before fetching it
  const sizeResponse = await axios.head(url);
  const size = sizeResponse.headers["content-length"];

  // If the size exceeds the limit (such as 5 MB), return an error
  if (size > 5 * 1024 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: "The specified image is too large.",
    });
  }

  const response = await axios.get(url, { responseType: "arraybuffer" });

  // Ensure mime type of the response content will be an image
  const type = response.headers["content-type"];
  if (!type.startsWith("image/")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Specified URL does not point to an image.",
    });
  }

  // Set appropriate headers and return an image response
  setHeader(event, "content-type", type);

  // Add caching headers
  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable"); // Cache for a year and don't revalidate

  return Buffer.from(response.data, "binary");
});
