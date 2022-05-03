/* eslint-disable no-underscore-dangle */
import React from 'react';
import L, { LeafletMouseEvent } from 'leaflet';
import {
  LayerProps, LeafletContextInterface, createLayerComponent,
} from '@react-leaflet/core';
import { observer } from 'mobx-react-lite';
import { MenuItem } from './ContextMenuItem';
import CMenuItems from './CMenuItems';
import MenuOverlay, { MenuItems, menu } from './menu';
export { MenuItem, MenuItems };

const ContextMenu = createLayerComponent<MenuOverlay, LayerProps>(
  (props: LayerProps, context: LeafletContextInterface) => ({
    instance: menu,
    context: { ...context, overlayContainer: menu },
  }),
  (
    instance: MenuOverlay,
  ) => {
    instance.update();
  },
);

const ContextMenuWrapper: React.FC = observer(() => (
  <>
    <ContextMenu />
    <CMenuItems open={menu.isOpen()} items={menu.menuItems} />
  </>
));

export const setMainContextMenu = (menuItems: MenuItems) => {
  menu.setMainMenuItems(menuItems);
};

export const showContextMenu = (
  menuItems?: MenuItems,
) => (
  (e: LeafletMouseEvent) => {
    let items: MenuItem[] = [];
    if (menuItems) {
      items = typeof menuItems === 'function'
        ? menuItems(e.latlng)
        : menuItems;
    }

    menu.open(e.latlng, e.sourceTarget, items);
    L.DomEvent.stop(e);
  }
);

export default ContextMenuWrapper;
