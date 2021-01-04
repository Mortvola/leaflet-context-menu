import { useState, useEffect, useRef } from 'react';

class ExclusiveStateMgr {
  constructor() {
    this.states = {};
    this.hasExclusivity = null;
    this.counter = (function* genFunc() {
      let c = 0;
      for (;;) {
        yield c;
        c += 1;
      }
    }());
  }

  setExclusiveState(id, state) {
    if (this.states[id]) {
      if (state) {
        // If something has the exclusive state then change that state to
        // the non-exclusive state.
        if (this.hasExclusivity !== null && this.hasExclusivity !== id) {
          if (
            this.states[this.hasExclusivity] && this.states[this.hasExclusivity].state
          ) {
            if (this.states[this.hasExclusivity].setState) {
              this.states[this.hasExclusivity].setState(false);
            }

            this.states[this.hasExclusivity].state = false;
          }
        }

        this.hasExclusivity = id;

        if (!this.states[id].state) {
          this.states[id].state = state;

          if (this.states[id].setState) {
            this.states[id].setState(state);
          }
        }
      }
      else {
        if (this.states[id].state) {
          this.states[id].state = state;
          if (this.states[id].setState) {
            this.states[id].setState(false);
          }
        }

        if (this.hasExclusivity === id) {
          this.hasExclusivity = null;
        }
      }
    }
  }
}

// The state manager outside of the "managers" object is the
// default "unnamed" manager.
const stateMgr = new ExclusiveStateMgr();
const managers = {};

const useExclusiveState = (initialState, name) => {
  const idRef = useRef(null);
  const [state, setState] = useState(initialState);

  let mgr = stateMgr;

  if (name !== undefined && name === null) {
    if (managers[name] === undefined) {
      managers[name] = new ExclusiveStateMgr();
    }

    mgr = managers[name];
  }

  // Assign an id to the ref if not already assigned
  if (idRef.current === null) {
    idRef.current = mgr.counter.next().value;
  }

  // If a state with the current id is not
  // represented in the state object then add it
  if (!mgr.states[idRef.current]) {
    mgr.states[idRef.current] = {
      state,
      setState,
    };
  }

  useEffect(() => (
    // Remove the state from the state object when unmounting
    () => {
      delete mgr.states[idRef.current];
      if (idRef.current === mgr.hasExclusivity) {
        mgr.hasExclusivity = null;
      }
    }
  ), [mgr]);

  // Return the state and the setExclusiveState function
  return [
    state,
    (newState) => {
      mgr.setExclusiveState(idRef.current, newState).bind(mgr);
    },
  ];
};

export default useExclusiveState;
