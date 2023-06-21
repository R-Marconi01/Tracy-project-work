import Server "./lib";
import Blob "mo:base/Blob";
import CertifiedCache "mo:certified-cache";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import HM "mo:base/HashMap";
import HashMap "mo:StableHashMap/FunctionalStableHashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import serdeJson "mo:serde/JSON";
import Option "mo:base-0.7.3/Option";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";

shared ({ caller = creator }) actor class () {
  type Response = Server.Response;
  type HttpRequest = Server.HttpRequest;
  type HttpResponse = Server.HttpResponse;

  type FileObject = {
    filename : Text;
  };
  
  stable var files = Trie.empty<Text, Blob>();
  func key(x : Text) : Trie.Key<Text> { { key = x; hash = Text.hash(x) } };

  stable var cacheStorage : Server.SerializedEntries = ([], [], [creator]);

  var server = Server.Server({
    serializedEntries = cacheStorage;
  });

  public query func http_request(req : HttpRequest) : async HttpResponse {
    server.http_request(req);
  };
  
  public func http_request_update(req : HttpRequest) : async HttpResponse {
    server.http_request_update(req);
  };

  public func invalidate_cache() : async () {
    server.empty_cache();
  };

  system func preupgrade() {
    cacheStorage := server.entries();
  };

  system func postupgrade() {
    ignore server.cache.pruneAll();
  };

  func processFileObject(data : Text) : ?FileObject {
    let blob = serdeJson.fromText(data);
    from_candid (blob);
  };

  public func store(path : Text, content : Blob) {
    let (newFiles, existing) = Trie.put(
      files, // Target trie
      key(path), // Key
      Text.equal, // Equality checker
      content,
    );

    files := newFiles;
  };

  server.post(
    "/file.pdf",
    func(req, res) : Response {
      let body = req.body;
      switch body {
        case null {
          Debug.print("body not parsed");
          res.send({
            status_code = 400;
            headers = [];
            body = Text.encodeUtf8("Invalid JSON");
            streaming_strategy = null;
            cache_strategy = #noCache;
          });
        };
        case (?body) {
          let bodyText = body.text();
          Debug.print(bodyText);
          let fileObj = processFileObject(bodyText);
          switch fileObj {
            case null {
              res.send({
                status_code = 400;
                headers = [];
                body = Text.encodeUtf8("Error in process json.");
                streaming_strategy = null;
                cache_strategy = #noCache;
              });
            };
            case (?fileObj) {
              let file = Trie.get(files, key(fileObj.filename), Text.equal);
              switch file {
                case null {
                  return res.send({
                    status_code = 404;
                    headers = [];
                    body = Text.encodeUtf8("File not found");
                    streaming_strategy = null;
                    cache_strategy = #noCache;
                  });
                };
                case (?blob) {
                  return res.send({
                    status_code = 200;
                    headers = [("Content-Type", "application/pdf")];
                    body = blob;
                    streaming_strategy = null;
                    cache_strategy = #default;
                  });
                };
              };
            }
          }
        };
      };
    },
  );
};