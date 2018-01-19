"use strict";

const server = require("../index");
const axios = require("axios");
const config = require("config");
const FormData = require("form-data");
const assert = require("assert");
const readFile = require("fs-readfile-promise");

const serverConfig = config.get("server");

async function uploadImage({
  imageBuffer,
  filename,
  imageHeight,
  imageWidth,
  resizeStrategy = "centre",
}) {
  const form = new FormData();

  form.append("image", imageBuffer, filename);
  form.append("imageHeight", imageHeight);
  form.append("imageWidth", imageWidth);
  form.append("resizeStrategy", resizeStrategy);
  return axios
    .post(`http://localhost:${serverConfig.port}/image`, form, {
      headers: form.getHeaders(),
    })
    .then(response => response.data.url)
    .catch(error => Promise.reject(error.response.data));
}

describe("IntegrationTests", () => {
  describe("POST /image", () => {
    it("should successfully upload a png", async () => {
      const imageBuffer = await readFile("./src/tests/fixtures/image.png");
      const url = await uploadImage({
        filename: "filename.png",
        imageBuffer,
        imageHeight: 150,
        imageWidth: 150,
      });
      assert(url);
    });

    it("should successfully upload a png with max strategy", async () => {
      const imageBuffer = await readFile("./src/tests/fixtures/image.png");
      const url = await uploadImage({
        filename: "filename.png",
        imageBuffer,
        imageHeight: 150,
        imageWidth: 150,
        resizeStrategy: "max",
      });
      assert(url);
    });

    it("should successfully upload an svg", async () => {
      const imageBuffer = await readFile("./src/tests/fixtures/image.svg");
      const url = await uploadImage({
        filename: "filename.svg",
        imageBuffer,
        imageHeight: 150,
        imageWidth: 150,
      });
      assert(url);
    });

    it("should not accept non-image file types", async () => {
      const imageBuffer = await readFile("./src/tests/fixtures/document.txt");
      try {
        await uploadImage({
          filename: "filename.txt",
          imageBuffer,
          imageHeight: 150,
          imageWidth: 150,
        });
        assert(null);
      } catch (e) {
        return null;
      }
    });
  });

  after(() => {
    server.close();
  });
});
