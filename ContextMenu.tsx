import React, {
  ReactElement, useCallback, useEffect, useRef, useState,
} from 'react';
// import PropTypes, { number } from 'prop-types';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import useExclusiveState from './ExclusiveState';

type MenuItemCallback = (event: L.LeafletMouseEvent) => void;
type CreateMenuCallback = (event: L.LeafletMouseEvent) => Array<MenuItemTypes>;

export type MenuItem = {
  type?: string,
  label: string,
  callback: MenuItemCallback,
}

export type MenuItemSeparator = {
  type: 'separator',
}

const isMenuItemSeparator = (item: MenuItem | MenuItemSeparator): item is MenuItemSeparator => (
  item.type === 'separator'
);

export type MenuItemTypes = MenuItem | MenuItemSeparator;

type ItemProps = {
  menuItem: MenuItem,
  onHide: () => void,
  menuEvent: L.LeafletMouseEvent,
}

const ContextMenuItem = ({
  menuItem,
  onHide,
  menuEvent,
}: ItemProps): ReactElement => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: L.DomEvent.PropagableEvent) => {
      if (event) {
        L.DomEvent.stopPropagation(event);
        menuItem.callback(menuEvent);
        onHide();
      }
    };

    const handleMouseDown = (event: L.DomEvent.PropagableEvent) => {
      if (event) {
        L.DomEvent.stopPropagation(event);
      }
    };

    const handleMouseUp = (event: L.DomEvent.PropagableEvent) => {
      if (event) {
        L.DomEvent.stopPropagation(event);
      }
    };

    if (itemRef.current) {
      L.DomEvent.on(itemRef.current, 'click', handleClick);
      L.DomEvent.on(itemRef.current, 'mouseup', handleMouseDown);
      L.DomEvent.on(itemRef.current, 'mouseup', handleMouseUp);
    }

    const element = itemRef.current;

    return () => {
      if (element) {
        L.DomEvent.off(element, 'click', handleClick);
        L.DomEvent.off(element, 'mouseup', handleMouseDown);
        L.DomEvent.off(element, 'mouseup', handleMouseUp);
      }
    };
  }, [menuEvent, menuItem, onHide]);

  return (
    <div ref={itemRef} className="contextmenu-item">
      {menuItem.label}
    </div>
  );
};

// ContextMenuItem.propTypes = {
//   menuItem: PropTypes.shape().isRequired,
//   setShow: PropTypes.func.isRequired,
//   menuEvent: PropTypes.shape().isRequired,
// };

export type MenuItems = Array<MenuItemTypes> | CreateMenuCallback;

type Menus = {
  [key: string]: MenuItems,
}

const menus: Menus = {};

const isCreateMenuCallback = (
  items: MenuItems,
): items is CreateMenuCallback => (
  items instanceof Function
);

type Props = {
  items: MenuItems,
  event: L.LeafletMouseEvent,
  // eslint-disable-next-line react/require-default-props
  base?: string,
  onHide: () => void,
}

const ContextMenu = ({
  items,
  event,
  base,
  onHide,
}: Props): ReactElement => {
  const map = useMap();

  // If the menu is unmounted, make sure the
  // "show" state is set to false
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stop(e);
      onHide();
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onHide]);

  let separatorCounter = 0;

  const renderSeparator = () => {
    separatorCounter += 1;

    return (
      <div key={`sep:${separatorCounter}`} className="leaflet-control-layers-separator" />
    );
  };

  const renderItems = (i: Array<MenuItemTypes>) => (
    <>
      {
        i.map((item) => {
          if (isMenuItemSeparator(item)) {
            return renderSeparator();
          }

          return (
            <ContextMenuItem
              key={item.label}
              menuItem={item}
              menuEvent={event}
              onHide={onHide}
            />
          );
        })
      }
    </>
  );

  const renderBaseMenu = () => {
    if (base) {
      let i = menus[base];
      if (isCreateMenuCallback(i)) {
        i = i(event);
      }

      return (
        <>
          { renderSeparator() }
          { renderItems(i) }
        </>
      );
    }

    return null;
  };

  const renderContextMenu = () => {
    if (event) {
      const point = map.latLngToContainerPoint(event.latlng);
      let i = items;
      if (isCreateMenuCallback(i)) {
        i = i(event);
      }

      return (
        <div
          className="leaflet-control context-menu"
          style={{
            left: point.x,
            top: point.y,
          }}
        >
          {
            renderItems(i)
          }
          {
            renderBaseMenu()
          }
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {
        renderContextMenu()
      }
    </>
  );
};

// ContextMenu.propTypes = {
//   items: PropTypes.oneOfType([
//     PropTypes.arrayOf(PropTypes.shape()),
//     PropTypes.func,
//   ]),
//   children: PropTypes.oneOfType([
//     PropTypes.arrayOf(PropTypes.shape()),
//     PropTypes.shape(),
//   ]).isRequired,
// };

// ContextMenu.defaultProps = {
//   items: [],
// };

type ShowContextMenu = (event: L.LeafletMouseEvent) => void;

function useContextMenu(
  name: string,
  items: MenuItems,
  base?: string,
): [() => ReactElement | null, ShowContextMenu] {
  const [show, setShow] = useExclusiveState(false);
  const [event, setEvent] = useState<L.LeafletMouseEvent | null>(null);

  menus[name] = items;

  const createMenu = useCallback((): ReactElement | null => {
    const handleHide = () => {
      setShow(false);
    };

    if (show && event) {
      return (
        <ContextMenu
          items={items}
          event={event}
          base={base}
          onHide={handleHide}
        />
      );
    }

    return null;
  }, [base, event, items, setShow, show]);

  return [
    createMenu,
    ((e: L.LeafletMouseEvent) => {
      setEvent(e);
      setShow(true);
    })];
}

export default useContextMenu;
