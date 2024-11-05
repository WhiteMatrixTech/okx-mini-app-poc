/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { OKXUniversalConnectUI } from "@okxconnect/ui";

// b2 mainnet chainId
const chainId = "223";
const addressStorageKey = "login_address";
function App() {
  const [address, setAddress] = useState<string>(
    () => localStorage.getItem(addressStorageKey) || ""
  );
  const [client, setClient] = useState<OKXUniversalConnectUI | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    async function initClient() {
      if (initRef.current) return;
      initRef.current = true;
      try {
        const client = await OKXUniversalConnectUI.init({
          dappMetaData: {
            icon: "https://world3.ai/assets/WORLD3Logo_black.png",
            name: "World3",
          },
          actionsConfiguration: {
            returnStrategy: "tg://resolve",
            tmaReturnUrl: "back",
          },
        });
        setClient(client);
        // 虽然每次页面加载 client 都会重新初始化，但是只要不要执行 client.disconnect, session 就不会变
        console.log("session", client.session);
      } catch (e) {
        console.error(e);
      } finally {
        initRef.current = false;
      }
    }
    initClient();
  }, []);

  return (
    <div className="flex items-center justify-center">
      {address ? (
        <div className="flex items-center gap-4">
          <div>{address}</div>
          <button
            onClick={async () => {
              await client?.disconnect();
              setAddress("");
              localStorage.removeItem(addressStorageKey);
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={async () => {
            try {
              if (initRef.current) {
                alert("正在初始化，请稍后再试");
                return;
              }
              if (!client) {
                alert("初始化失败！请刷新页面重试");
                return;
              }
              if (client.connected()) {
                // 关闭之前的 connected session, 重新唤起登录弹窗选择钱包账户
                await client.disconnect();
              }
              // 初始化一个新的 session
              const session = await client.openModal({
                namespaces: {
                  eip155: {
                    chains: [`eip155:${chainId}`],
                    defaultChain: chainId,
                    rpcMap: {
                      "223": "https://rpc.bsquared.network",
                    },
                  },
                },
              });
              if (session) {
                console.log("poc: ", session, client);
                const addressWithChain = session.namespaces["eip155"].accounts[0];
                // 签名
                const hexMsg = toHex("Hello world3");
                const signature = await client.request<string>({
                  method: "personal_sign",
                  params: [hexMsg, addressWithChain.split(":")[2]],
                });
                console.log("poc", signature);
                setAddress(addressWithChain);
                localStorage.setItem(addressStorageKey, addressWithChain);
              } else {
                throw new Error("Init session failed!");
              }
            } catch (e) {
              alert("Login Failed!");
              console.error("poc: ", e);
            }
          }}
        >
          Login And Sign
        </button>
      )}
    </div>
  );
}

export default App;

function toHex(str: string) {
  return `0x${str
    .split("")
    .map((char: string) => {
      return ("0" + char.charCodeAt(0).toString(16)).slice(-2);
    })
    .join("")}`;
}
