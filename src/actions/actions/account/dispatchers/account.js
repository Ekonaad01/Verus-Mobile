import { LOADING_ACCOUNT, VALIDATING_ACCOUNT } from "../../../../utils/constants/constants";
import { signIntoAuthenticatedAccount } from "../../../actionCreators";
import { COIN_MANAGER_MAP, fetchActiveCoins, setUserCoins } from "../../coins/Coins";
import { activateChainLifecycle } from "../../intervals/dispatchers/lifecycleManager";
import { initPersonalDataForUser } from "../../personal/dispatchers/personal";
import { initServiceAuthDataForUser } from "../../services/dispatchers/services";
import { fetchUsers, validateLogin } from "../../UserData";
import { initSettings, saveGeneralSettings } from "../../WalletSettings";
import { DISABLED_CHANNELS } from '../../../../../env/index'
import store from "../../../../store";
import { clearAllCoinIntervals } from "../../intervals/dispatchers/IntervalCreator";

export const initializeAccountData = async (
  account,
  password,
  makeDefault = false,
  setInitStep = () => {}
) => {
  setInitStep(VALIDATING_ACCOUNT)
  const accountAuthenticator = await validateLogin(account, password);
  
  if (accountAuthenticator) {
    setInitStep(LOADING_ACCOUNT)

    if (makeDefault) {
      await saveGeneralSettings({
        defaultAccount: account.accountHash,
      });
    }

    const coinList = await fetchActiveCoins()
    const setUserCoinsAction = setUserCoins(coinList.activeCoinList, account.id)
    const { activeCoinsForUser } = setUserCoinsAction

    store.dispatch(await initSettings())
    store.dispatch(accountAuthenticator)
    store.dispatch(coinList)
    store.dispatch(setUserCoinsAction)

    for (let i = 0; i < activeCoinsForUser.length; i++) {
      const coinObj = activeCoinsForUser[i]

      await Promise.all(coinObj.compatible_channels.map(channel => {
        if (!DISABLED_CHANNELS.includes(channel) && COIN_MANAGER_MAP.initializers[channel]) {
          return COIN_MANAGER_MAP.initializers[channel](coinObj)
        } else return null
      }))

      activateChainLifecycle(coinObj.id);
    }

    await initPersonalDataForUser(account.accountHash)
    await initServiceAuthDataForUser(account.accountHash)
    store.dispatch(signIntoAuthenticatedAccount())
  } else {
    throw new Error(
      `Failed to validate and initialize account "${account.id}"`
    );
  }
};

export const clearActiveAccountLifecycles = () => {
  const state = store.getState()

  state.coins.activeCoinList.map(coinObj => {
    clearAllCoinIntervals(coinObj.id)
  })
}

export const refreshAccountData = async (
  accountHash,
  password,
  makeDefault = false,
  setInitStep = () => {}
) => {
  clearActiveAccountLifecycles();
  store.dispatch(await fetchUsers())
  const newAccount = store
    .getState()
    .authentication.accounts.find(
      (account) => account.accountHash === accountHash
    );

  return await initializeAccountData(
    newAccount,
    password,
    (makeDefault = false),
    (setInitStep = () => {})
  );
};
