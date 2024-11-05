/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import "./App.css";
import { OKXUniversalConnectUI } from "@okxconnect/ui";

function App() {
  const [address, setAddress] = useState("");
  const [client, setClient] = useState<OKXUniversalConnectUI | null>(null);
  const [isIniting, setIniting] = useState(false);

  useEffect(() => {
    async function initClient() {
      setIniting(true);
      try {
        const client = await OKXUniversalConnectUI.init({
          dappMetaData: {
            icon: "https://world3.ai/assets/WORLD3Logo_black.png",
            name: "World3",
          },
          actionsConfiguration: {
            returnStrategy: "tg://resolve",
            modals: "all",
            tmaReturnUrl: "back",
          },
          restoreConnection: true,
        } as any);
        setClient(client);
      } catch (e) {
        console.error(e);
      } finally {
        setIniting(false);
      }
    }
    initClient();
  },[]);

  return (
    <div className="flex items-center justify-center">
      {address ? (
        <div className="flex items-center gap-x-4">
          <span>{address}</span>
          <button
            onClick={async () => {
              await client?.disconnect();
              setAddress("");
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={async () => {
            try {
              if(isIniting) {
                alert("正在初始化，请稍后再试")
                return;
              }
              if (!client) {
                alert('初始化失败！请刷新页面重试');
                return;
              }
              if (client.connected()) {
                // 关闭之前的 connected session
                await client.disconnect();
              }
              // 初始化一个新的 session
              const session = await client.openModal({
                namespaces: {
                  eip155: {
                    chains: ["eip155:223"],
                    defaultChain: "223",
                    rpcMap: {
                      "223": "https://rpc.bsquared.network",
                    },
                  },
                },
              });
              if (session) {
                console.log("poc: ", session, client);
                setAddress(session.namespaces["eip155"].accounts[0]);
              } else {
                throw new Error("Init session failed!");
              }
            } catch (e) {
              alert("Login Failed!");
              console.error("poc: ", e);
            }
          }}
        >
          Login
        </button>
      )}
    </div>
  );
}

export default App;