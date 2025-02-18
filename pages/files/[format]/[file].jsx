import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import path from "path";
import { fs } from "file-system";
import matter from "gray-matter";
import { compile, run } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkHtml from "remark-html";
import * as runtime from "react/jsx-runtime"; // Production.
import { Previewer } from "pagedjs";

const glob = require("glob");

export async function getStaticPaths() {
  let paths = [];

  const targetDir = path.join(process.cwd(), "markdown", "/");
  // grab all markdown files

  const docPaths = glob.sync(path.join(targetDir, "**/*.{md,mdx}"));
  docPaths.forEach((element) => {
    paths.push({
      params: {
        format: "pdf",
        file: element.replace(targetDir, ""),
      },
    });
    paths.push({
      params: {
        format: "ppt",
        file: element.replace(targetDir, ""),
      },
    });
    paths.push({
      params: {
        format: "mdx",
        file: element.replace(targetDir, ""),
      },
    });
    return paths;
  });

  return {
    paths,
    fallback: true,
  };
}
export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), "markdown", params.file);
  const fileData = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileData);
  const source = await compile(content, {
    remarkPlugins: [remarkGfm, remarkMath, remarkHtml],
    outputFormat: "function-body",
    development: false,
  });
  return {
    props: {
      source: String(source),
      format: params.format,
    },
  };
}
export default function File({ source, format }) {
  const [mdxModule, setMdxModule] = useState();
  const mdxContainer = useRef(null);
  const previewContainer = useRef(null);
  const Content = mdxModule ? mdxModule.default : React.Fragment;
  let contentMdx = ``;

  useEffect(() => {
    (async () => {
      setMdxModule(await run(source, runtime));
    })();
    (async () => {
      if (mdxContainer.current !== null && previewContainer.current !== null) {
        let paged = new Previewer();
        let flow = paged
          .preview(mdxContainer.current, ["/pdf.css"], previewContainer.current)
          .then((flow) => {
            console.log("Rendered", flow.total, "pages.");
          });
      }
    })();
  }, [source, format]);

  if (format === "pdf") {
    return (
      <>
        <div ref={mdxContainer} style={{ display: "none" }}>
          <Content />
        </div>
        <div className="pagedjs_page" ref={previewContainer}></div>
      </>
    );
  }
  return (
    <div>
      <h1>test</h1>
      <Content />
    </div>
  );
}
