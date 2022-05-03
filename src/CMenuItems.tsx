import React from 'react';
import ReactDOM from 'react-dom';
import ContextMenuItem, { MenuItem } from './ContextMenuItem';
import { menu } from './menu';
import styles from './CMenuItems.module.css';

type CMenuItemsProps = {
  open: boolean,
  items: MenuItem[],
}

const CMenuItems:React.FC<CMenuItemsProps> = ({
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
      console.log('closing menu 1');
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

export default CMenuItems;
