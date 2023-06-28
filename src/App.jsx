import { useState } from "react";
import "./App.css";

function App() {
  const [className, setClassName] = useState("");
  const [results, setResults] = useState([]);

  const supportsFileSystemAccessAPI =
    "getAsFileSystemHandle" in DataTransferItem.prototype;
  const supportsWebkitGetAsEntry =
    "webkitGetAsEntry" in DataTransferItem.prototype;

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDragEnter = () => {
    setClassName("outline");
  };

  const onDragLeave = () => {
    setClassName("");
  };

  const onDropItems = async (e) => {
    // Prevent navigation.
    e.preventDefault();
    if (!supportsFileSystemAccessAPI && !supportsWebkitGetAsEntry) {
      // Cannot handle directories.
      return;
    }
    // Unhighlight the drop zone.
    setClassName("");

    const files = await getAllFileEntries(e.dataTransfer.items);
    const flattenFiles = files.reduce((acc, val) => acc.concat(val), []);
    console.log("Results here dude!!! : ", flattenFiles);
    setResults(flattenFiles);
  };

  const getAllFileEntries = async (dataTransferItemList) => {
    let fileEntries = [];
    // Use BFS to traverse entire directory/file structure
    let queue = [];
    // Unfortunately dataTransferItemList is not iterable i.e. no forEach
    for (let i = 0; i < dataTransferItemList.length; i++) {
      queue.push(dataTransferItemList[i].webkitGetAsEntry());
    }
    while (queue.length > 0) {
      let entry = queue.shift();
      if (entry.isFile) {
        fileEntries.push(entry);
      } else if (entry.isDirectory) {
        let reader = entry.createReader();
        queue.push(...(await readAllDirectoryEntries(reader)));
      }
    }
    // return fileEntries;
    return Promise.all(
      fileEntries.map((entry) => readEntryContentAsync(entry))
    );
  };

  // Get all the entries (files or sub-directories) in a directory by calling readEntries until it returns empty array
  const readAllDirectoryEntries = async (directoryReader) => {
    let entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
      entries.push(...readEntries);
      readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
  };

  // Wrap readEntries in a promise to make working with readEntries easier
  const readEntriesPromise = async (directoryReader) => {
    try {
      return await new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const readEntryContentAsync = async (entry) => {
    return new Promise((resolve, reject) => {
      let reading = 0;
      const contents = [];

      reading++;
      entry.file(async (file) => {
        reading--;
        const rawFile = file;
        rawFile.path = entry.fullPath;
        contents.push(rawFile);

        if (reading === 0) {
          resolve(contents);
        }
      });
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Drag and drop one or multiple files or directories into the rectangle
        </p>
        <div
          id="dropzone"
          className={className}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDropItems}
        >
          Drop your directory here
        </div>

        {!!results.length &&
          results.map((result) => <div key={result.path}>{result.path}</div>)}
      </header>
    </div>
  );
}

export default App;
