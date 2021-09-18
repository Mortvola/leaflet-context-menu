import {
  useState,
} from 'react';

type StateEntry = {
  state: boolean;
  setState: (state: boolean) => void,
}

class ExclusiveStateMgr {
  states: { [key: number]: StateEntry} = {};

  hasExclusivity: number | null = null;

  counter: Generator<number, never, unknown>;

  constructor() {
    this.counter = (function* genFunc() {
      let c = 0;
      for (;;) {
        yield c;
        c += 1;
      }
    }());
  }

  setExclusiveState(id: number, state: boolean) {
    if (this.states[id]) {
      if (state) {
        // If something has the exclusive state then change that state to
        // the non-exclusive state.
        if (this.hasExclusivity !== null && this.hasExclusivity !== id) {
          if (
            this.states[this.hasExclusivity] && this.states[this.hasExclusivity].state
          ) {
            this.states[this.hasExclusivity].setState(false);
            this.states[this.hasExclusivity].state = false;
          }
        }

        this.hasExclusivity = id;

        if (!this.states[id].state) {
          this.states[id].state = state;
          this.states[id].setState(state);
        }
      }
      else {
        if (this.states[id].state) {
          this.states[id].state = state;
          this.states[id].setState(false);
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
const managers: {
  [key: string]: ExclusiveStateMgr,
} = {};

function useExclusiveState(
  initialState: boolean,
  name?: string,
): [boolean, (state: boolean) => void] {
  const [state, setState] = useState(initialState);
  const [setExclusiveState] = useState(() => {
    let mgr = stateMgr;

    if (name !== undefined && name === null) {
      if (managers[name] === undefined) {
        managers[name] = new ExclusiveStateMgr();
      }

      mgr = managers[name];
    }

    const id = mgr.counter.next().value;

    // If a state with the current id is not
    // represented in the state object then add it
    if (!mgr.states[id]) {
      mgr.states[id] = {
        state,
        setState,
      };
    }

    return (newState: boolean) => {
      if (id !== null) {
        mgr.setExclusiveState(id, newState);
      }
    };
  });

  // Return the state and the setExclusiveState function
  return [
    state,
    setExclusiveState,
  ];
}

export default useExclusiveState;
