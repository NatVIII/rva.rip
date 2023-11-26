const axios = require("axios");

module.exports = async (req, res) => {
  const imgUrl = req.query.url;
  const response = await axios.get(imgUrl, {
    responseType: "arraybuffer",
  });

  // Ensure mime type of the response content will be an image
  const type = response.headers["content-type"];
  if (!type.startsWith("image/"))
    return res.status(400).send("Specified URL does not point to an image.");

  // Set appropriate headers and return an image response
  res.setHeader("content-type", type);

  // Add caching headers
  res.setHeader(
    "Cache-Control",
    "public, max-age=31536000, immutable"
  ); // Cache for a year and don't revalidate

  res.send(Buffer.from(response.data, "binary"));
};