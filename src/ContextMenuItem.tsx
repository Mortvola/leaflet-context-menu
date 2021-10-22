/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, {
  ReactElement,
} from 'react';
import { LatLng } from 'leaflet';
import styles from './ContextMenuItem.module.css';

type MenuItemCallback = (latLng: LatLng) => void;

export type MenuItem = {
  type?: string,
  label: string,
  callback: MenuItemCallback,
}

type ItemProps = {
  menuItem: MenuItem,
  // eslint-disable-next-line react/require-default-props
  latLng: LatLng,
  closeMenu: () => void,
}

const ContextMenuItem = ({
  menuItem,
  latLng,
  closeMenu,
}: ItemProps): ReactElement => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    menuItem.callback(latLng);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={styles.contextmenuItem}
      onClick={handleClick}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onMouseMove={stopPropagation}
    >
      {menuItem.label}
    </div>
  );
};

export default ContextMenuItem;
