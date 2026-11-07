"use client";

import React, { useState, useEffect } from "react";
import { SmartPosView } from "../../components/SmartPosView";
import {
  loadInitialData,
  saveStateToStorage,
  syncStateWithServer,
  initRealtimeSync,
} from "../../lib/store";
import { Table, Order, ProductItem } from "../../lib/types";
import { INITIAL_TABLES, INITIAL_ORDERS, PRODUCTS } from "../../lib/mock-data";
import { StoreSettings } from "../../lib/server-db";

export default function PosPage() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings | undefined>(undefined);

  useEffect(() => {
    const data = loadInitialData();
    setTables(data.tables);
    setOrders(data.orders);
    if (data.products?.length) setProducts(data.products);

    const cleanup = initRealtimeSync((db) => {
      if (db.tables) setTables(db.tables);
      if (db.orders) setOrders(db.orders);
      if (db.products) setProducts(db.products);
      if (db.settings) setSettings(db.settings);
    });

    return () => cleanup();
  }, []);

  const syncState = (newTables: Table[], newOrders: Order[], notification?: string) => {
    setTables(newTables);
    setOrders(newOrders);
    syncStateWithServer(newTables, newOrders, undefined, undefined, undefined, notification);
  };

  const handleAddSubcomanda = (tableNumber: number, name: string) => {
    const newComandaId = `c-t${tableNumber}-${Date.now()}`;
    const updated = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        return {
          ...tbl,
          status: "ocupada" as const,
          comandas: [
            ...tbl.comandas,
            {
              id: newComandaId,
              tableId: tbl.id,
              customerName: name,
              isConnectedViaPhone: true,
              status: "aberta" as const,
              items: [],
              total: 0,
            },
          ],
        };
      }
      return tbl;
    });

    syncState(updated, orders, `👤 Smart POS: Nova comanda na Mesa ${tableNumber}!`);
  };

  const handleAddItemToComanda = (
    tableNumber: number,
    comandaId: string,
    product: ProductItem,
    customItem?: {
      quantity?: number;
      price?: number;
      optionsSelected?: string[];
      notes?: string;
    }
  ) => {
    const finalPrice = customItem?.price !== undefined ? customItem.price : product.price;
    const finalQty = customItem?.quantity || 1;
    const finalOptions = customItem?.optionsSelected || [];
    const finalNotes = customItem?.notes;

    const updated = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        let found = false;
        let coms = tbl.comandas.map((cmd) => {
          if (cmd.id === comandaId || (!found && tbl.comandas.length === 1)) {
            found = true;
            const newItem = {
              id: `item-${Date.now()}-${Math.random()}`,
              productId: product.id,
              name: product.name,
              price: finalPrice,
              quantity: finalQty,
              optionsSelected: finalOptions,
              notes: finalNotes,
            };
            return {
              ...cmd,
              items: [...cmd.items, newItem],
              total: cmd.total + finalPrice * finalQty,
            };
          }
          return cmd;
        });

        if (!found) {
          coms = [
            ...coms,
            {
              id: comandaId,
              tableId: tbl.id,
              customerName: "Cliente Smart POS",
              isConnectedViaPhone: false,
              status: "aberta" as const,
              items: [
                {
                  id: `item-${Date.now()}`,
                  productId: product.id,
                  name: product.name,
                  price: finalPrice,
                  quantity: finalQty,
                  optionsSelected: finalOptions,
                  notes: finalNotes,
                },
              ],
              total: finalPrice * finalQty,
            },
          ];
        }

        return {
          ...tbl,
          status: "ocupada" as const,
          comandas: coms,
        };
      }
      return tbl;
    });

    // Gera pedido KDS na cozinha com todos os adicionais e remoções (Totem BK/Mc)
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: Math.max(...orders.map((o) => o.orderNumber || 0), 100) + 1,
      type: "mesa",
      tableNumber,
      comandaName: "Smart POS",
      customerName: "Smart POS Terminal",
      items: [
        {
          id: `item-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: finalPrice,
          quantity: finalQty,
          optionsSelected: finalOptions,
          notes: finalNotes,
        },
      ],
      subtotal: finalPrice * finalQty,
      deliveryFee: 0,
      discount: 0,
      total: finalPrice * finalQty,
      status: "em_preparo",
      createdAt: "Agora mesmo",
    };

    const notif = `⚡ Smart POS: ${finalQty}x ${product.name} ${finalNotes ? `[${finalNotes}]` : ""} lançado na Mesa ${tableNumber}!`;
    syncState(updated, [newOrder, ...orders], notif);
  };

  const handleRemoveItemFromComanda = (
    tableNumber: number,
    comandaId: string,
    itemId: string
  ) => {
    let removedItemName = "";
    const updated = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        return {
          ...tbl,
          comandas: tbl.comandas.map((cmd) => {
            if (cmd.id === comandaId) {
              const itemToCancel = cmd.items.find((i) => i.id === itemId);
              if (itemToCancel) removedItemName = itemToCancel.name;
              const newItems = cmd.items.filter((i) => i.id !== itemId);
              const newTotal = newItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
              return {
                ...cmd,
                items: newItems,
                total: newTotal,
              };
            }
            return cmd;
          }),
        };
      }
      return tbl;
    });

    const updatedOrders = orders
      .map((ord) => {
        if (ord.tableNumber === tableNumber && ord.status !== "entregue") {
          const itemIdx = ord.items.findIndex(
            (it) => it.id === itemId || it.name === removedItemName
          );
          if (itemIdx >= 0) {
            const newItems = ord.items.filter((_, idx) => idx !== itemIdx);
            const subtotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
            return { ...ord, items: newItems, subtotal, total: subtotal };
          }
        }
        return ord;
      })
      .filter((ord) => ord.items.length > 0 || ord.status === "entregue");

    const notif = `🗑️ Smart POS: 1x ${removedItemName || "item"} removido da Mesa ${tableNumber}`;
    syncState(updated, updatedOrders, notif);
  };

  const handleCloseComanda = (tableNumber: number, comandaId: string) => {
    const updated = tables.map((tbl) => {
      if (tbl.number === tableNumber) {
        const remaining = tbl.comandas.filter((c) => c.id !== comandaId);
        return {
          ...tbl,
          comandas: remaining,
          status: remaining.length === 0 ? ("livre" as const) : tbl.status,
        };
      }
      return tbl;
    });

    syncState(updated, orders, `💰 Smart POS: Comanda quitada na Mesa ${tableNumber}!`);
  };

  return (
    <SmartPosView
      tables={tables}
      products={products}
      storeName={settings?.storeName}
      onAddSubcomanda={handleAddSubcomanda}
      onAddItemToComanda={handleAddItemToComanda}
      onRemoveItemFromComanda={handleRemoveItemFromComanda}
      onCloseComanda={handleCloseComanda}
    />
  );
}