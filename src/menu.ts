import L, {
  DomUtil,
  LatLng, LeafletEventHandlerFn, LeafletMouseEvent, Map,
} from 'leaflet';
import { makeObservable, observable, runInAction } from 'mobx';
import styles from './ContextMenu.module.css';
import { MenuItem } from './ContextMenuItem';

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
      console.log('closing menu with escape');
      this.close();
    }
    else {
      console.log(`handleKeyDown: ${e.type}`);
    }
  }

  handleClick(e: LeafletMouseEvent) {
    console.log('handle click');
    console.log(e.type)
    this.close();
  }

  getEvents(): { [name: string]: LeafletEventHandlerFn } {
    return {
      // preclick: () => {
      //   console.log('close menu with preclick');
      //   this.close();
      // },
      zoomstart: () => {
        console.log('close menu with zoomstart');
        this.close();
      },
      movestart: () => {
        console.log('close menu with movestart');
        this.close();
      },
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

    // if (sourceTarget) {
    //   L.DomEvent.on(sourceTarget, 'remove', this.close, this);
    // }

    L.DomEvent.on(document.documentElement, 'keydown', this.handleKeyDown, this);
    this._map.on('mousedown', this.handleClick, this);

    runInAction(() => {
      this.menuItems = items;
    });

    if (this._container) {
      this._container.style.display = 'initial';
    }
  }

  close() {
    console.log('closing menu');
    L.DomEvent.off(document.documentElement, 'keydown', this.handleKeyDown, this);
    this._map.off('mousedown', this.handleClick, this);
  
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

    const pane = this.getPane(this.options.pane);

    if (pane && this._container) {
      pane.appendChild(this._container);
      this.update();
    }

    return this;
  }

  onRemove(map: Map) {
    if (this._container) {
      console.log('removing context menu layer');
      L.DomUtil.remove(this._container);
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

export { menu };
export default MenuOverlay;