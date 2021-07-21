/*
  The coin reducer contains general channel specific information
*/

import {
  INIT_WYRE_SERVICE_CHANNEL_FINISH,
  CLOSE_WYRE_SERVICE_CHANNEL,
  SIGN_OUT_COMPLETE
} from '../../utils/constants/storeType'

export const channelStore_wyre = (state = {
  openChannels: {},
}, action) => {
  switch (action.type) {
    case INIT_WYRE_SERVICE_CHANNEL_FINISH:
      return {
        ...state,
        openChannels: {
          ...state.openChannels,
          [action.payload.chainTicker]: true
        },
      }
    case CLOSE_WYRE_SERVICE_CHANNEL:
      return {
        ...state,
        openChannels: {
          ...state.openChannels,
          [action.payload.chainTicker]: false
        },
      }
    case SIGN_OUT_COMPLETE:
      return {
        openChannels: {}
      }
    default:
      return state;
  }
}