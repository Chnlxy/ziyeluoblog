import assert from "node:assert/strict";
import test from "node:test";

import { chromium } from "playwright-core";

import { atmosphereFragmentShader } from "../lib/earthAtmosphereShader.ts";

const probeVertexShader = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vWorldNormal = normalize(vec3(aPosition.x, aPosition.y, 1.0));
    vViewDirection = vec3(0.0, 0.0, 1.0);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

async function launchSystemBrowser() {
  if (process.env.CHROME_PATH) {
    return chromium.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
      args: [
        "--enable-unsafe-swiftshader",
        "--use-angle=swiftshader",
      ],
    });
  }

  const errors = [];
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({
        channel,
        headless: true,
        args: [
          "--enable-unsafe-swiftshader",
          "--use-angle=swiftshader",
        ],
      });
    } catch (error) {
      errors.push(`${channel}: ${String(error)}`);
    }
  }

  throw new Error(
    [
      "No system Chromium browser is available.",
      "Set CHROME_PATH to launch a headless browser for the WebGL test.",
      ...errors,
    ].join("\n"),
  );
}

test("compiles the production cloud shader and shades toward the sun", async () => {
  const browser = await launchSystemBrowser();
  try {
    const page = await browser.newPage();
    try {
      const result = await page.evaluate(
        ({ fragmentShader, probeVertexShader }) => {
          const canvas = document.createElement("canvas");
          canvas.width = 17;
          canvas.height = 17;
          const gl = canvas.getContext("webgl");
          if (!gl) return { error: "WebGL1 context is unavailable" };

          const compile = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
              const log = gl.getShaderInfoLog(shader) || "";
              gl.deleteShader(shader);
              throw new Error(log);
            }
            return shader;
          };

          let vertexShader;
          let fragment;
          let program;
          try {
            vertexShader = compile(
              gl.VERTEX_SHADER,
              probeVertexShader,
            );
            fragment = compile(
              gl.FRAGMENT_SHADER,
              `precision highp float;\n${fragmentShader}`,
            );
            program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragment);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
              throw new Error(gl.getProgramInfoLog(program) || "link failed");
            }
          } catch (error) {
            return { error: String(error) };
          }

          gl.useProgram(program);

          const vertices = new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
          ]);
          const positionBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
          const positionLocation = gl.getAttribLocation(
            program,
            "aPosition",
          );
          gl.enableVertexAttribArray(positionLocation);
          gl.vertexAttribPointer(
            positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0,
          );

          const createTexture = (width, height, rgba) => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              width,
              height,
              0,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              new Uint8Array(rgba),
            );
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_MIN_FILTER,
              gl.NEAREST,
            );
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_MAG_FILTER,
              gl.NEAREST,
            );
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_WRAP_S,
              gl.CLAMP_TO_EDGE,
            );
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_WRAP_T,
              gl.CLAMP_TO_EDGE,
            );
            return texture;
          };

          const width = 32;
          const height = 16;
          const cloudPixels = [];
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const value = x < width / 2 ? 30 : 255;
              cloudPixels.push(value, value, value, 255);
            }
          }

          const groundPixels = new Array(4).fill(0);
          groundPixels[3] = 255;

          gl.activeTexture(gl.TEXTURE0);
          createTexture(width, height, cloudPixels);
          gl.uniform1i(
            gl.getUniformLocation(program, "cloudMap"),
            0,
          );
          gl.activeTexture(gl.TEXTURE1);
          createTexture(1, 1, groundPixels);
          gl.uniform1i(
            gl.getUniformLocation(program, "earthDayMap"),
            1,
          );

          gl.uniform1f(gl.getUniformLocation(program, "uHasClouds"), 1);
          gl.uniform2f(
            gl.getUniformLocation(program, "uCloudTexel"),
            1 / width,
            1 / height,
          );

          const renderWithSun = (sun) => {
            gl.uniform3f(
              gl.getUniformLocation(program, "sunDirection"),
              ...sun,
            );
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            const pixels = new Uint8Array(4);
            gl.readPixels(8, 8, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            return Array.from(pixels);
          };

          const east = renderWithSun([1, 0, 0]);
          const west = renderWithSun([-1, 0, 0]);
          return {
            east,
            west,
            compilerError: null,
          };
        },
        {
          fragmentShader: atmosphereFragmentShader,
          probeVertexShader,
        },
      );

      if (result.error) {
        assert.fail(result.error);
      }

      assert.ok(
        result.east[0] + 4 < result.west[0],
        `expected shaded east pixel (${result.east.join(",")}) to be darker than lit west pixel (${result.west.join(",")})`,
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
