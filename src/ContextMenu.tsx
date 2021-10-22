/* eslint-disable no-underscore-dangle */
import React, { FC, ReactElement } from 'react';
import ReactDOM from 'react-dom';
import L, {
  DomUtil,
  LatLng, LeafletEventHandlerFn, LeafletMouseEvent,
} from 'leaflet';
import {
  LayerProps, LeafletContextInterface, createLayerComponent,
} from '@react-leaflet/core';
import { observer } from 'mobx-react-lite';
import { makeObservable, observable, runInAction } from 'mobx';
import styles from './ContextMenu.module.css';
import ContextMenuItem, { MenuItem } from './ContextMenuItem';

export { MenuItem };

export type MenuItems = MenuItem[] | ((position: LatLng) => MenuItem[]);

class MenuOverlay extends L.Layer {
  private _container?: HTMLDivElement;

  private _latlng?: LatLng = new LatLng(0, 0);

  private listenersAdded = false;

  mainMenuItems: MenuItems = [];

  menuItems: MenuItem[] = [];

  private _open = false;

  options: { offset: [number, number], pane: string } = {
    offset: [0, 0],
    pane: 'popupPane',
  }

  constructor() {
    super();

    makeObservable(this, {
      menuItems: observable,
    });
  }

  handleKeyDown(e: Event) {
    if ((e as KeyboardEvent).key === 'Escape') {
      this.close();
    }
  }

  getEvents(): { [name: string]: LeafletEventHandlerFn } {
    return {
      preclick: () => this.close(),
      zoomstart: () => this.close(),
      movestart: () => this.close(),
    };
  }

  setMainMenuItems(menuItems: MenuItems) {
    this.mainMenuItems = menuItems;
  }

  setLatLng(latLng: LatLng) {
    this._latlng = latLng;
  }

  getLatLng(): LatLng | undefined {
    return this._latlng;
  }

  getElement(): HTMLDivElement | undefined {
    return this._container;
  }

  open(latlng: LatLng, sourceTarget: any, items: MenuItem[]) {
    this._open = true;
    this.setLatLng(latlng);

    if (sourceTarget) {
      L.DomEvent.on(sourceTarget, 'remove', this.close, this);
    }

    L.DomEvent.on(document.documentElement, 'keydown', this.handleKeyDown, this);

    runInAction(() => {
      this.menuItems = items;
    });

    if (this._container) {
      this._container.style.display = 'initial';
    }
  }

  close() {
    L.DomEvent.off(document.documentElement, 'keydown', this.handleKeyDown, this);

    this._open = false;
    // this.setLatLng(new LatLng(0, 0));
    // this.remove();
    if (this._container) {
      this._container.style.display = 'none';
    }
  }

  isOpen(): boolean {
    return this._open;
  }

  onAdd() {
    if (!this._container) {
      this._initLayout();
    }

    const pane = this.getPane('popupPane');

    if (pane && this._container) {
      pane.appendChild(this._container);
      this.update();
    }

    return this;
  }

  update() {
    this._updateLayout();

    const element = this._container;

    if (element && this._latlng) {
      const point = this._map.latLngToLayerPoint(this._latlng);

      DomUtil.setPosition(element, point);

      const { offset } = this.options; // toPoint(this.options.offset);
      element.style.bottom = `${(-offset[1]).toString()}px`;
      element.style.left = `${(-offset[0]).toString()}px`;
    }
  }

  private _initLayout() {
    this._container = document.createElement('div');
    this._container.setAttribute('class', styles.contextMenu);
    this._container.style.display = 'none';
  }

  private _updateLayout() {
    const element = this.getElement();
    const latLng = this.getLatLng();

    if (element && latLng) {
      const rect = element.getBoundingClientRect();

      const mapElement = this._map.getContainer();
      const mapRect = mapElement.getBoundingClientRect();

      const point = this._map.latLngToContainerPoint(latLng);

      let xOffset = 0;
      let yOffset = 0;

      if (mapRect.x + point.x + rect.width > mapRect.right) {
        xOffset = rect.width;
      }

      if (point.y - rect.height < 0) {
        yOffset = rect.height;
      }

      this.options.offset = [xOffset, yOffset];
    }
  }
}

const menu = new MenuOverlay();

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

type CMenuItemsProps = {
  open: boolean,
  items: MenuItem[],
}

const CMenuItems:FC<CMenuItemsProps> = ({
  open,
  items,
}) => {
  const element = menu.getElement();
  if (element && open) {
    const latLng = menu.getLatLng();

    if (!latLng) {
      throw new Error('latLng is undefined');
    }

    const close = () => {
      menu.close();
    };

    const mainItems = typeof menu.mainMenuItems === 'function'
      ? menu.mainMenuItems(latLng)
      : menu.mainMenuItems;

    return ReactDOM.createPortal(
      <>
        <>
          {
            items
              ? items.map((item) => (
                <ContextMenuItem
                  key={item.label}
                  menuItem={item}
                  latLng={latLng}
                  closeMenu={close}
                />
              ))
              : null
          }
        </>
        {
          items.length > 0 && mainItems.length > 0
            ? <div className={styles.separator} />
            : null
        }
        <>
          {
            mainItems
              ? mainItems.map((item) => (
                <ContextMenuItem
                  key={item.label}
                  menuItem={item}
                  latLng={latLng}
                  closeMenu={close}
                />
              ))
              : null
          }
        </>
      </>,
      element,
    );
  }

  return null;
};

const ContextMenuWrapper = observer((): ReactElement | null => (
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
