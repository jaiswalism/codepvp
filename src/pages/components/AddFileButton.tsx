import { useState } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";

function AddFileForm() {
  const { sandpack } = useSandpack();

  const [folder, setFolder] = useState("");
  const [name, setName] = useState("");

  const createFile = () => {
    if (!name) return;

    const path = folder
      ? `/${folder}/${name}`
      : `/${name}`;

    sandpack.updateFile(
      path,
`export default function NewComponent() {
  return <div>Hello</div>;
}`
    );

    setFolder("");
    setName("");
  };

  return (
    <div>
      <input
        placeholder="folder (optional)"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
      />

      <input
        placeholder="file name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={createFile}>Create File</button>
    </div>
  );
}

export default AddFileForm;