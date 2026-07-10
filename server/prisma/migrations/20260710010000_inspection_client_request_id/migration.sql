ALTER TABLE "inspecoes" ADD COLUMN "client_request_id" TEXT;

CREATE UNIQUE INDEX "inspecoes_client_request_id_key" ON "inspecoes"("client_request_id");
