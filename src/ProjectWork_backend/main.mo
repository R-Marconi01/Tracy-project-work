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
  type Row = {
    id : Nat;
    companyName : Text;
    cityDestination : Text;
    supplier : Text;
    cityOrigin : Text;
    productType : Text;
    quantity : Nat;
  };

  let db = Buffer.Buffer<Row>(3);

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

  server.get(
    "/get_row_db", func(req, res) : Response {
      var counter = 0;

      var rowJson = "[ ";
      for (row in db.vals()) {
        rowJson := rowJson # "\"" # Nat.toText(counter) # "\": { \"id\": \"" # Nat.toText(row.id) # "\", \"companyName\": \"" # row.companyName # "\", \"cityDestination\": \"" # row.cityDestination # "\", \"supplier\": \"" # row.supplier # "\", \"cityOrigin\": \"" # row.cityOrigin # "\", \"productType\": \"" # row.productType # "\", \"quantity\": " # Nat.toText(row.quantity) # " }, ";
        counter += 1;
      };
      rowJson := Text.trimEnd(rowJson, #text ", ");
      rowJson := rowJson # " ]";

      res.json({
        status_code = 200;
        body = rowJson;
        cache_strategy = #noCache;
      });
    },
  );

  func processRow(data : Text) : ?Row{
    let blob = serdeJson.fromText(data);
    from_candid (blob);
  };

  server.post(
    "/add_row", func(req, res) : Response {
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
          let row = processRow(bodyText);
          switch (row) {
            case null {
              Debug.print("row not parsed");
              res.send({
                status_code = 400;
                headers = [];
                body = Text.encodeUtf8("Invalid JSON");
                streaming_strategy = null;
                cache_strategy = #noCache;
              });
            };
            case (?row) {
              db.add(row);
              res.json({
                status_code = 200;
                body = bodyText;
                cache_strategy = #noCache;
              });
            };
          };
        };
      };
    },
  );

  public func getDB() : async [Row] {
    Buffer.toArray(db);
  };

};