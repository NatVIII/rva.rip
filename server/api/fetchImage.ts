const axios = require("axios");

import { Request, Response } from 'express';

module.exports = async (req: Request, res: Response) => {
  const imgUrl = req.query.url;

  // Check the size of the image before fetching it
  const sizeResponse = await axios.head(imgUrl);
  const size = sizeResponse.headers["content-length"];

  // If the size exceeds the limit (such as 5 MB), return an error
  if (size > 5 * 1024 * 1024) 
    return res.status(413).send("The specified image is too large.");

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