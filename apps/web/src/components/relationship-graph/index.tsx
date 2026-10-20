'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store';
import { useTranslation } from '../../i18n';

interface Node {
  id: string;
  label: string;
  type: 'order' | 'product' | 'group' | 'user';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface Edge {
  source: string;
  target: string;
}

export const RelationshipGraph: React.FC = () => {
  const { t, formatProductType } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orders = useAppSelector((state) => state.orders.items);
  const products = useAppSelector((state) => state.products.items);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Build nodes & edges
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, Node>();

    // 1. Order nodes
    orders.slice(0, 4).forEach((o, i) => {
      const node: Node = {
        id: `order-${o.id}`,
        label: `Order: ${o.title.substring(0, 14)}...`,
        type: 'order',
        x: width * 0.2 + (i * 60),
        y: height * 0.3 + (i % 2 === 0 ? -40 : 40),
        vx: 0,
        vy: 0,
        color: '#8bc34a',
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // 2. Product nodes
    products.slice(0, 8).forEach((p, i) => {
      const node: Node = {
        id: `product-${p.id}`,
        label: `SN-${p.serialNumber}`,
        type: 'product',
        x: width * 0.5 + ((i % 4) * 50),
        y: height * 0.5 + (Math.floor(i / 4) * 60) - 30,
        vx: 0,
        vy: 0,
        color: '#03a9f4',
      };
      nodes.push(node);
      nodeMap.set(node.id, node);

      // Edge from order to product
      if (p.orderId && nodeMap.has(`order-${p.orderId}`)) {
        edges.push({ source: `order-${p.orderId}`, target: node.id });
      }
    });

    // 3. User node
    const userNode: Node = {
      id: 'user-main',
      label: 'Христорождественский А.',
      type: 'user',
      x: width * 0.8,
      y: height * 0.4,
      vx: 0,
      vy: 0,
      color: '#ff9800',
    };
    nodes.push(userNode);
    nodeMap.set(userNode.id, userNode);

    // Link user to some products
    products.slice(0, 4).forEach((p) => {
      if (nodeMap.has(`product-${p.id}`)) {
        edges.push({ source: `product-${p.id}`, target: 'user-main' });
      }
    });

    let animationFrameId: number = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      ctx.lineWidth = 1.5;
      edges.forEach((edge) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (s && t) {
          ctx.strokeStyle = '#cfd8dc';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        const radius = node.type === 'order' ? 14 : node.type === 'user' ? 12 : 9;
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#2c3c44';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + radius + 14);
      });
    };

    render();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const clicked = nodes.find((n) => {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= 16;
      });

      setSelectedNode(clicked || null);
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [orders, products]);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cfd8dc',
        borderRadius: 4,
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2c3c44' }}>
          {t.analytics.graphTitle}
        </h3>
        <p style={{ fontSize: 13, color: '#546e7a', marginTop: 4 }}>
          {t.analytics.graphDesc}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8bc34a' }} />
          {t.analytics.graphOrders}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#03a9f4' }} />
          {t.analytics.graphProducts}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9800' }} />
          {t.analytics.graphUsers}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={850}
        height={360}
        style={{
          width: '100%',
          height: 360,
          background: '#f8fafb',
          borderRadius: 4,
          border: '1px solid #eaeff2',
        }}
      />

      {selectedNode && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 14px',
            background: '#e8f5e9',
            border: '1px solid #c8e6c9',
            borderRadius: 4,
            fontSize: 12,
            color: '#2e7d32',
          }}
        >
          {t.analytics.graphSelectedNode} <strong>{selectedNode.label}</strong> ({t.products.type} {formatProductType(selectedNode.type)})
        </div>
      )}
    </div>
  );
};

export default RelationshipGraph;
