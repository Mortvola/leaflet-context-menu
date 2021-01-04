import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import useExclusiveState from './ExclusiveState';

const ContextMenuItem = ({
  menuItem,
  setShow,
  menuEvent,
}) => {
  const itemRef = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (event) {
        L.DomEvent.stopPropagation(event);
        menuItem.callback(menuEvent);
        setShow(false);
      }
    };

    const handleMouseDown = (event) => {
      if (event) {
        L.DomEvent.stopPropagation(event);
      }
    };

    const handleMouseUp = (event) => {
      if (event) {
        L.DomEvent.stopPropagation(event);
      }
    };

    L.DomEvent.on(itemRef.current, 'click', handleClick);
    L.DomEvent.on(itemRef.current, 'mouseup', handleMouseDown);
    L.DomEvent.on(itemRef.current, 'mouseup', handleMouseUp);

    const element = itemRef.current;

    return () => {
      L.DomEvent.off(element, 'click', handleClick);
      L.DomEvent.off(element, 'mouseup', handleMouseDown);
      L.DomEvent.off(element, 'mouseup', handleMouseUp);
    };
  }, [menuEvent, menuItem, setShow]);

  return (
    <div ref={itemRef} className="contextmenu-item">
      {menuItem.label}
    </div>
  );
};

ContextMenuItem.propTypes = {
  menuItem: PropTypes.shape().isRequired,
  setShow: PropTypes.func.isRequired,
  menuEvent: PropTypes.shape().isRequired,
};

let registeredContextMenu = false;

const ContextMenu = ({
  items,
  children,
}) => {
  const [show, setShow] = useExclusiveState(false);
  const [menuPosition, setMenuPosition] = useState();
  const [menuEvent, setMenuEvent] = useState();
  const map = useMap();

  const openContextMenu = (event) => {
    setMenuEvent(event);
    setMenuPosition(event.latlng);
    setShow(true);
    L.DomEvent.stop(event);
  };

  if (!registeredContextMenu) {
    map.on('contextmenu', openContextMenu);
    registeredContextMenu = true;
  }

  // If the menu is unmounted, make sure the
  // "show" state is set to false
  useEffect(() => {
    const handleClick = (event) => {
      L.DomEvent.stop(event);
      setShow(false);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  });

  const renderChildren = () => {
    if (Array.isArray(children)) {
      return children.map((c, index) => {
        if (c !== null) {
          return React.cloneElement(
            c,
            {
              // eslint-disable-next-line react/no-array-index-key
              key: index,
              eventHandlers: {
                contextmenu: openContextMenu,
              },
            },
          );
        }

        return null;
      });
    }

    return React.cloneElement(children, {
      eventHandlers: {
        contextmenu: openContextMenu,
      },
    });
  };

  const renderContextMenu = () => {
    const point = map.latLngToContainerPoint(menuPosition);
    let i = items;
    if (items instanceof Function) {
      i = items(menuEvent);
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
          i.map((item) => (
            <ContextMenuItem
              key={item.label}
              menuItem={item}
              menuEvent={menuEvent}
              setShow={setShow}
            />
          ))
        }
      </div>
    );
  };

  return (
    <>
      {
        renderChildren()
      }
      {
        show && menuPosition
          ? renderContextMenu()
          : null
      }
    </>
  );
};

ContextMenu.propTypes = {
  items: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.shape()),
    PropTypes.func,
  ]),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.shape()),
    PropTypes.shape(),
  ]).isRequired,
};

ContextMenu.defaultProps = {
  items: [],
};

export default ContextMenu;
