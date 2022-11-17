import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export let web3ModalProvider = undefined

export async function connectToWallet() {
  web3ModalProvider = await web3Modal
    .connect()
    .then(web3provider => web3provider)
    .catch(err => {
      console.log("Could not get a wallet connection", err);
      return null;
    });
  return new Web3(web3ModalProvider);
}

export function clearWalletProvider() {
  web3Modal.clearCachedProvider();
}

const providerOptions = {
  injected: {
    display: {
      logo: 'https://github.com/MetaMask/brand-resources/raw/master/SVG/metamask-fox.svg',
      name: 'MetaMask',
      description: 'Connect with MetaMask in your browser',
    },
    package: null,
  },
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      chainId: 43114,
      // chainId: 25,
      rpc: {
          43114: "https://api.avax.network/ext/bc/C/rpc/",
      },
      network: 'avalanche-fuji-mainnet',
      metadata: {
          icons: ["https://ebisusbay.com/vector%20-%20face.svg"],
          description: "TheHexagon"
      }
    }
  }
};

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions
});
