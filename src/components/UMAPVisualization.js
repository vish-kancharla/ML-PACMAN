import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as UMAP from "umap-js";
import { useAtom } from "jotai";
import {
  imgSrcArrAtom,
  trainingProgressAtom,
  visualizationActiveAtom,
} from "../GlobalState";

export default function UMAPVisualization({ width = 525, height = 400 }) {
  const svgRef = useRef();
  const [imgSrcArr] = useAtom(imgSrcArrAtom);
  const [trainingProgress] = useAtom(trainingProgressAtom);
  const [isVisualizationActive] = useAtom(visualizationActiveAtom);

  // Define color scale at component level
  const colorScale = d3
    .scaleOrdinal()
    .domain(["up", "down", "left", "right"])
    .range(["#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]);

  useEffect(() => {
    if (!imgSrcArr.length || !isVisualizationActive) return;

    const margin = { top: 40, right: 120, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    let g = svg.select("g");
    if (g.empty()) {
      g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`);

      g.append("g")
        .attr("class", "y-axis");

      g.append("text")
        .attr("class", "x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 35)
        .attr("text-anchor", "middle")
        .text("UMAP Dimension 1");

      g.append("text")
        .attr("class", "y-label")
        .attr("x", -innerHeight / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("UMAP Dimension 2");

      const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${innerWidth + 20}, 0)`);

      ["up", "down", "left", "right"].forEach((label, i) => {
        const legendItem = legend
          .append("g")
          .attr("transform", `translate(0,${i * 25})`);

        legendItem
          .append("circle")
          .attr("r", 5)
          .attr("fill", colorScale(label));

        legendItem
          .append("text")
          .attr("x", 15)
          .attr("y", 5)
          .text(label)
          .style("font-size", "12px");
      });
    }

    // Convert images to numerical features
    const features = imgSrcArr.map((img) => {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 32; // Reduced dimensions for UMAP
          canvas.height = 32;
          ctx.drawImage(image, 0, 0, 32, 32);
          const imageData = ctx.getImageData(0, 0, 32, 32).data;
          resolve(Array.from(imageData));
        };
        image.src = img.src;
      });
    });

    Promise.all(features).then((featureVectors) => {
      const umap = new UMAP.UMAP({
        nComponents: 2,
        nNeighbors: 15,
        minDist: 0.1,
      });

      const embedding = umap.fit(featureVectors);

      // Update scales to use inner dimensions
      const xScale = d3
        .scaleLinear()
        .domain([
          d3.min(embedding, (d) => d[0]),
          d3.max(embedding, (d) => d[0]),
        ])
        .range([0, innerWidth])
        .nice();

      const yScale = d3
        .scaleLinear()
        .domain([
          d3.min(embedding, (d) => d[1]),
          d3.max(embedding, (d) => d[1]),
        ])
        .range([innerHeight, 0])
        .nice();

      // Update axes with transition
      const t = d3.transition().duration(750);
      
      g.select(".x-axis")
        .transition(t)
        .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight))
        .call(g => g.selectAll(".domain").remove());

      g.select(".y-axis")
        .transition(t)
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth))
        .call(g => g.selectAll(".domain").remove());

      g.selectAll(".tick line")
        .attr("stroke", "#ddd")
        .attr("stroke-dasharray", "2,2");

      // Update points using enter/update/exit pattern
      const points = g.selectAll("circle.point")
        .data(embedding);

      points.enter()
        .append("circle")
        .attr("class", "point")
        .attr("r", 5)
        .attr("opacity", 0.7)
        .merge(points)
        .transition(t)
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr("fill", (d, i) => colorScale(imgSrcArr[i].label));

      points.exit().remove();

      // Add hover effects
      g.selectAll("circle.point")
        .on("mouseover", function(event, d) {
          d3.select(this).transition().duration(200).attr("r", 8);
        })
        .on("mouseout", function(event, d) {
          d3.select(this).transition().duration(200).attr("r", 5);
        });
    });
  }, [imgSrcArr, trainingProgress, width, height, isVisualizationActive]);

  if (!isVisualizationActive) return null;

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginTop: "30px",
        marginLeft: "-15px",
        width: "fit-content",
      }}
    >
      <h3 style={{ marginTop: "30px", marginBottom: "20px" }}>
        UMAP Visualization of Training Data
      </h3>
      <svg
        ref={svgRef}
        style={{
          backgroundColor: "white",
          borderRadius: "4px",
        }}
      />
    </div>
  );
}
