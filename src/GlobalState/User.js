import { createSlice } from '@reduxjs/toolkit';
import { Contract, ethers, BigNumber } from 'ethers';
import config from '../constants/contractConfig';
import NFTABI from '../constants/abiNFT.json';
import Web3Modal from 'web3modal';

import detectEthereumProvider from '@metamask/detect-provider';
import { DeFiWeb3Connector } from 'deficonnect';
import WalletConnectProvider from '@walletconnect/web3-provider';
import * as DefiWalletConnectProvider from '@deficonnect/web3-provider';
import { appAuthInitFinished } from './InitSlice';
import { captureException } from '@sentry/react';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    // Wallet
    provider: null,
    address: null,
    web3modal: null,
    connectingWallet: false,
    gettingContractData: true,
    needsOnboard: false,

    // Contracts
    honeyContract: null,
    nftContract: null,
    stakingContract: null,

    correctChain: false,
    showWrongChainModal: false,
  },
  reducers: {
    accountChanged(state, action) {
      state.balance = action.payload.balance;
      state.honeyContract = action.payload.honeyContract;
      state.nftContract = action.payload.nftContract;
      state.stakingContract = action.payload.stakingContract;
    },

    onCorrectChain(state, action) {
      state.correctChain = action.payload.correctChain;
    },

    onProvider(state, action) {
      state.provider = action.payload.provider;
      state.needsOnboard = action.payload.needsOnboard;
      state.correctChain = action.payload.correctChain;
    },

    onBasicAccountData(state, action) {
      state.address = action.payload.address;
      state.provider = action.payload.provider;
      state.web3modal = action.payload.web3modal;
      state.correctChain = action.payload.correctChain;
      state.needsOnboard = action.payload.needsOnboard;
    },

    connectingWallet(state, action) {
      state.connectingWallet = action.payload.connecting;
    },

    setShowWrongChainModal(state, action) {
      state.showWrongChainModal = action.payload;
    },
    onLogout(state) {
      state.connectingWallet = false;
      const web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions: [], // required
      });
      web3Modal.clearCachedProvider();
      if (state.web3modal != null) {
        state.web3modal.clearCachedProvider();
      }
      state.web3modal = null;
      state.provider = null;
      localStorage.clear();
      state.address = '';
      state.balance = null;
    },
    balanceUpdated(state, action) {
      state.balance = action.payload;
    },
  },
});

export const {
  accountChanged,
  onProvider,
  connectingWallet,
  onCorrectChain,
  setShowWrongChainModal,
  onBasicAccountData,
  onLogout,
} = userSlice.actions;
export const user = userSlice.reducer;

export const connectAccount =
  (firstRun = false, type = "") =>
    async (dispatch) => {
      const providerOptions = {
        injected: {
          display: {
            logo: 'https://github.com/MetaMask/brand-resources/raw/master/SVG/metamask-fox.svg',
            name: 'MetaMask',
            description: 'Connect with MetaMask in your browser',
          },
          package: null,
        },
        // 'custom-defiwallet': {
        //   display: {
        //     logo: '/assets/cdc_logo.svg',
        //     name: 'Crypto.com DeFi Wallet',
        //     description: 'Connect with the CDC DeFi Wallet',
        //   },
        //   options: {},
        //   package: DefiWalletConnectProvider,
        //   connector: async (ProviderPackage, options) => {
        //     const connector = new DeFiWeb3Connector({
        //       supportedChainIds: [25, 338],
        //       rpc: { 25: 'https://gateway.nebkas.ro', 338: 'https://cronos-testnet-3.crypto.org:8545/' },
        //       pollingInterval: 15000,
        //       metadata: {
        //         icons: ['https://ebisusbay.com/vector%20-%20face.svg'],
        //         description: 'Cronos NFT Marketplace',
        //       },
        //     });

        //     await connector.activate();
        //     let provider = await connector.getProvider();
        //     return provider;
        //   },
        // },
      };

      if (type !== "defi") {
        providerOptions.walletconnect = {
          package: WalletConnectProvider, // required
          options: {
            chainId: 43114,
            rpc: {
              43114: "https://api.avax.network/ext/bc/C/rpc",
            },
            network: 'avalanche-fuji-mainnet',
            metadata: {
              icons: ["https://ebisusbay.com/vector%20-%20face.svg"],
              description: "TheHexagon"
            }
          }
        }
      }

      const web3ModalWillShowUp = !localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER');

      if (process.env.NODE_ENV !== 'production') {
        console.log('web3ModalWillShowUp: ', web3ModalWillShowUp);
      }

      const web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
      });

      const web3provider = await web3Modal
        .connect()
        .then((web3provider) => web3provider)
        .catch((error) => {
          captureException(error, { extra: { firstRun } });
          console.log('Could not get a wallet connection', error);
          return null;
        });

      if (!web3provider) {
        dispatch(onLogout());
        return;
      }

      try {
        dispatch(connectingWallet({ connecting: true }));
        const provider = new ethers.providers.Web3Provider(web3provider);

        const cid = await web3provider.request({
          method: 'net_version',
        });

        const correctChain = cid === config.chain_id || cid === Number(config.chain_id);

        const accounts = await web3provider.request({
          method: 'eth_accounts',
          params: [{ chainId: cid }],
        });

        const address = accounts[0];
        const signer = provider.getSigner();

        if (!correctChain) {
          if (firstRun) {
            dispatch(appAuthInitFinished());
          }
          await dispatch(setShowWrongChainModal(true));
        }

        //console.log(correctChain);
        await dispatch(
          onBasicAccountData({
            address: address,
            provider: provider,
            web3modal: web3Modal,
            needsOnboard: false,
            correctChain: correctChain,
          })
        );
        if (firstRun) {
          dispatch(appAuthInitFinished());
        }
        web3provider.on('DeFiConnectorDeactivate', (error) => {
          dispatch(onLogout());
        });

        web3provider.on('disconnect', (error) => {
          dispatch(onLogout());
        });

        web3provider.on('accountsChanged', (accounts) => {
          dispatch(onLogout());
          dispatch(connectAccount());
        });

        web3provider.on('DeFiConnectorUpdate', (accounts) => {
          window.location.reload();
        });

        web3provider.on('chainChanged', (chainId) => {
          // Handle the new chain.
          // Correctly handling chain changes can be complicated.
          // We recommend reloading the page unless you have good reason not to.

          window.location.reload();
        });

        let nft_contract;
        let balance;

        if (signer && correctChain) {
          nft_contract = new Contract(config.nft_contract, NFTABI, signer);
          try {
            balance = ethers.utils.formatEther(await provider.getBalance(address));
          } catch (error) {
            console.log('Error checking CRO balance', error);
          }
        }
        console.log(signer, correctChain, nft_contract)

        await dispatch(
          accountChanged({
            address: address,
            provider: provider,
            web3modal: web3Modal,
            needsOnboard: false,
            correctChain: correctChain,
            nftContract: nft_contract,
            balance: balance,
          })
        );
      } catch (error) {
        captureException(error, {
          extra: {
            firstRun,
            WEB3_CONNECT_CACHED_PROVIDER: localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER'),
            DeFiLink_session_storage_extension: localStorage.getItem('DeFiLink_session_storage_extension'),
          },
        });
        if (firstRun) {
          dispatch(appAuthInitFinished());
        }
        console.log(error);
        console.log('Error connecting wallet!');
        await web3Modal.clearCachedProvider();
        dispatch(onLogout());
      }
      dispatch(connectingWallet({ connecting: false }));
    };

export const initProvider = () => async (dispatch) => {
  const ethereum = await detectEthereumProvider();

  if (ethereum == null || ethereum !== window.ethereum) {
    console.log('not metamask detected');
  } else {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const cid = await ethereum.request({
      method: 'net_version',
    });

    const correctChain = cid === config.chain_id;

    let nft_contract;
    if (signer && correctChain) {
      nft_contract = new Contract(config.nft_contract, NFTABI, signer);
    }
    // const obj = {
    //   provider: provider,
    //   needsOnboard: false,
    //   membershipContract: mc,
    //   correctChain: correctChain,
    // };

    //dispatch(onProvider(obj))

    provider.on('accountsChanged', (accounts) => {
      dispatch(
        accountChanged({
          address: accounts[0],
        })
      );
    });

    provider.on('chainChanged', (chainId) => {
      // Handle the new chain.
      // Correctly handling chain changes can be complicated.
      // We recommend reloading the page unless you have good reason not to.

      window.location.reload();
    });
  }
};

export const chainConnect = (type) => async (dispatch) => {
  console.log(window.ethereum);
  if (window.ethereum) {
    const cid = ethers.utils.hexValue(BigNumber.from(config.chain_id));
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: cid }],
      });
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      // if it is not, then install it into the user MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainName: config.name,
                chainId: cid,
                rpcUrls: [config.write_rpc],
                blockExplorerUrls: null,
                nativeCurrency: {
                  name: config.symbol,
                  symbol: config.symbol,
                  decimals: 18,
                },
              },
            ],
          });
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: cid }],
          });
        } catch (addError) {
          console.error(addError);
          window.location.reload();
        }
      }
      console.log(error);
    }
  } else {
    const web3Provider = new WalletConnectProvider({
      rpc: {
        25: 'https://evm.cronos.org',
      },
      chainId: 25,
    });
  }
};

export const updateBalance = () => async (dispatch, getState) => {
  const { user } = getState();
  const { address, provider } = user;
  const balance = ethers.utils.formatEther(await provider.getBalance(address));
  dispatch(userSlice.actions.balanceUpdated(balance));
};