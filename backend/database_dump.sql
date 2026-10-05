-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: u731511898_hawupay
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `umkm_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta` json NOT NULL,
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_audit_logs_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('cfe30085-6d6a-498b-bf0f-4621cecb2d75','21a56c7a-9902-49fc-a7de-f0d7dd932dd4',NULL,'login','{\"email\": \"admin@umkm.id\"}','2026-10-05T06:41:32.966800+00:00'),('deaf2f13-bdc6-4191-a158-396256470684','21a56c7a-9902-49fc-a7de-f0d7dd932dd4',NULL,'login','{\"email\": \"admin@umkm.id\"}','2026-10-05T06:41:53.324300+00:00'),('e53939c9-30a9-432f-a096-0b80ae3fb85e','21a56c7a-9902-49fc-a7de-f0d7dd932dd4',NULL,'login','{\"email\": \"admin@umkm.id\"}','2026-10-05T06:39:47.527241+00:00');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `umkm_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nfc_card_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_customers_nfc_card_id` (`nfc_card_id`),
  KEY `ix_customers_umkm_card` (`umkm_id`,`nfc_card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('048d26ff-6c5c-4a22-8cea-679fbae9c47c','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Maria Dewi','0813-2222-0004','CARD-004',250000.00,'2026-10-05T06:36:02.684084+00:00'),('061c292d-f347-40c5-b078-8177b27d907a','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Budi Santoso','0813-2222-0001','CARD-001',500000.00,'2026-10-05T06:36:02.676015+00:00'),('10f30e47-bb83-4bfb-b29b-4b63767ba4ea','15c73f21-9761-4856-9c76-2f1fecad7888','Maria Dewi','0813-2222-0004','CARD-004',250000.00,'2026-10-05T06:36:01.878639+00:00'),('1147f68e-136f-4285-a6f3-c4cda08976ea','15c73f21-9761-4856-9c76-2f1fecad7888','Rudi Hartono','0813-2222-0005','CARD-005',750000.00,'2026-10-05T06:36:01.880810+00:00'),('1ff0423d-b045-4b32-abf6-9bf5aec630a3','15c73f21-9761-4856-9c76-2f1fecad7888','Siti Rahayu','0813-2222-0002','CARD-002',350000.00,'2026-10-05T06:36:01.873193+00:00'),('24fa81d6-2f3c-413c-854d-342cee8e6285','55721c6f-9f9d-433a-b56e-99abadc80b88','Budi Santoso','0813-2222-0001','CARD-001',500000.00,'2026-10-05T06:36:02.948097+00:00'),('2dc30d93-d3dd-4891-a9eb-7f5e8d2e4aff','55721c6f-9f9d-433a-b56e-99abadc80b88','Maria Dewi','0813-2222-0004','CARD-004',250000.00,'2026-10-05T06:36:02.955637+00:00'),('2f8164d1-8394-46a4-9cfe-f286559d4ef5','55721c6f-9f9d-433a-b56e-99abadc80b88','Andi Wijaya','0813-2222-0003','CARD-003',1000000.00,'2026-10-05T06:36:02.953344+00:00'),('325d8563-e73a-4a90-801f-10adf8437f75','55721c6f-9f9d-433a-b56e-99abadc80b88','Rudi Hartono','0813-2222-0005','CARD-005',750000.00,'2026-10-05T06:36:02.957990+00:00'),('36044e55-f271-4e84-a6fa-3406323477d9','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Rudi Hartono','0813-2222-0005','CARD-005',750000.00,'2026-10-05T06:36:02.686887+00:00'),('3faf002c-de90-4575-8449-66d5b550cb8a','9602e285-0bd0-4b73-8863-8e1053f1227b','Andi Wijaya','0813-2222-0003','CARD-003',1000000.00,'2026-10-05T06:36:02.132293+00:00'),('5089e308-1760-457a-8c49-1cc211433f4a','9602e285-0bd0-4b73-8863-8e1053f1227b','Maria Dewi','0813-2222-0004','CARD-004',250000.00,'2026-10-05T06:36:02.134983+00:00'),('68b32a64-34d7-4e84-ac18-cb6dbfbc7a8a','55721c6f-9f9d-433a-b56e-99abadc80b88','Siti Rahayu','0813-2222-0002','CARD-002',350000.00,'2026-10-05T06:36:02.950664+00:00'),('69665bf5-8a48-4475-a097-b71327899df5','82619325-e59a-4254-81e7-ef7f14b48fe2','Maria Dewi','0813-2222-0004','CARD-004',250000.00,'2026-10-05T06:36:02.428136+00:00'),('b13c0114-4a67-4585-a787-12cb862cc156','82619325-e59a-4254-81e7-ef7f14b48fe2','Budi Santoso','0813-2222-0001','CARD-001',500000.00,'2026-10-05T06:36:02.419830+00:00'),('bb5ab4d5-ae04-4424-86df-000d1edc46b1','82619325-e59a-4254-81e7-ef7f14b48fe2','Andi Wijaya','0813-2222-0003','CARD-003',1000000.00,'2026-10-05T06:36:02.425342+00:00'),('c3261228-6888-47b5-8ed1-5c65f1fc8d96','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Siti Rahayu','0813-2222-0002','CARD-002',350000.00,'2026-10-05T06:36:02.678855+00:00'),('cdbb5a73-0b18-464a-bb38-d5a03cd776dd','82619325-e59a-4254-81e7-ef7f14b48fe2','Rudi Hartono','0813-2222-0005','CARD-005',750000.00,'2026-10-05T06:36:02.430602+00:00'),('d052453a-efa8-4eb0-84ba-ae01cbbc9914','9602e285-0bd0-4b73-8863-8e1053f1227b','Siti Rahayu','0813-2222-0002','CARD-002',350000.00,'2026-10-05T06:36:02.130250+00:00'),('d2b41e2e-d972-45ff-ba1d-d5772047cda3','15c73f21-9761-4856-9c76-2f1fecad7888','Andi Wijaya','0813-2222-0003','CARD-003',1000000.00,'2026-10-05T06:36:01.875629+00:00'),('d7a3b771-0a1b-484d-8334-26f27a37a547','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Andi Wijaya','0813-2222-0003','CARD-003',1000000.00,'2026-10-05T06:36:02.681470+00:00'),('fce4c7ec-6bc5-41ba-81ec-1fbc668d0c9c','9602e285-0bd0-4b73-8863-8e1053f1227b','Budi Santoso','0813-2222-0001','CARD-001',500000.00,'2026-10-05T06:36:02.127828+00:00'),('fdf1afc7-3e1a-4852-859f-abd9b53a47ee','9602e285-0bd0-4b73-8863-8e1053f1227b','Rudi Hartono','0813-2222-0005','CARD-005',750000.00,'2026-10-05T06:36:02.137042+00:00'),('fedc13dc-1ff5-453b-897c-1954feecd961','82619325-e59a-4254-81e7-ef7f14b48fe2','Siti Rahayu','0813-2222-0002','CARD-002',350000.00,'2026-10-05T06:36:02.422696+00:00'),('fedd1def-d778-46ef-9728-3407ff7d9be1','15c73f21-9761-4856-9c76-2f1fecad7888','Budi Santoso','0813-2222-0001','CARD-001',500000.00,'2026-10-05T06:36:01.869877+00:00');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_requests`
--

DROP TABLE IF EXISTS `password_reset_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_code_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_code_expires_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reset_token_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires_at` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `ix_password_reset_user_status` (`user_id`,`status`),
  KEY `ix_password_reset_status_requested` (`status`,`requested_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_requests`
--

LOCK TABLES `password_reset_requests` WRITE;
/*!40000 ALTER TABLE `password_reset_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `umkm_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `stock` int NOT NULL DEFAULT '0',
  `image` text COLLATE utf8mb4_unicode_ci,
  `approval_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approval_note` text COLLATE utf8mb4_unicode_ci,
  `approved_at` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_products_umkm_id` (`umkm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('07530237-15b1-40bd-a924-36c90e702168','15c73f21-9761-4856-9c76-2f1fecad7888','Roti Kelapa','','Makanan',10000.00,30,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:01.862361+00:00'),('262d37da-a19c-4154-afc3-ade5714e9274','82619325-e59a-4254-81e7-ef7f14b48fe2','Gula Semut Lontar 250g','','Gula',35000.00,40,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.409170+00:00'),('31971f34-d7bb-4858-8901-21ec5553ec44','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Manisan Kelapa','','Snack',20000.00,40,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.669820+00:00'),('31bf265e-3c86-4810-b0b4-70c649df10d3','9602e285-0bd0-4b73-8863-8e1053f1227b','Selendang Ikat','','Kain',150000.00,20,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.120315+00:00'),('3359b8b2-9340-463a-b793-97a9cacf1053','9602e285-0bd0-4b73-8863-8e1053f1227b','Kain Tenun Motif Habba','','Kain',350000.00,15,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.117494+00:00'),('4843d423-f2a3-4908-99b2-7a2ea1af4943','55721c6f-9f9d-433a-b56e-99abadc80b88','Patung Kayu Kecil','','Kerajinan',75000.00,20,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.938670+00:00'),('672745a3-21ed-4965-8a04-943fe2191360','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Kelapa Muda','','Segar',10000.00,30,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.673130+00:00'),('68373184-827a-47c4-80cb-c7f545f322d0','15c73f21-9761-4856-9c76-2f1fecad7888','Kopi Sabu Robusta','','Minuman',15000.00,50,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:01.857972+00:00'),('754c3860-a4ad-48ef-97c5-a5ebc12bc840','15c73f21-9761-4856-9c76-2f1fecad7888','Air Mineral 600ml','','Minuman',5000.00,100,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:01.864751+00:00'),('877cf18a-27df-48b0-97ac-6c6195f0a106','76da9ff5-66f4-47ce-804e-9aa4b247ff38','Keripik Kelapa','','Snack',15000.00,60,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.665655+00:00'),('88a5b641-27e3-46ab-807f-c7e21ea2c0c1','15c73f21-9761-4856-9c76-2f1fecad7888','Nasi Bungkus','','Makanan',20000.00,25,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:01.867360+00:00'),('971d0bd3-36cf-4da6-8ad8-34da0c76732a','82619325-e59a-4254-81e7-ef7f14b48fe2','Sirup Lontar 500ml','','Sirup',45000.00,25,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.412553+00:00'),('bfdb16cf-844a-4feb-b62a-7e9c63be1b62','9602e285-0bd0-4b73-8863-8e1053f1227b','Sarung Tenun','','Kain',250000.00,12,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.124618+00:00'),('c46f595b-a727-4b7a-aa9b-8eb297b86d7c','55721c6f-9f9d-433a-b56e-99abadc80b88','Bingkai Foto Ukir','','Kerajinan',120000.00,15,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.945583+00:00'),('cea09eff-eaa5-4131-bee9-cbd2ab6cfa60','82619325-e59a-4254-81e7-ef7f14b48fe2','Kopi Lontar Blend','','Kopi',55000.00,30,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.416259+00:00'),('fc825df1-f7d7-4dff-81eb-60e478be2c3e','55721c6f-9f9d-433a-b56e-99abadc80b88','Gantungan Kunci Ukir','','Kerajinan',25000.00,50,NULL,NULL,NULL,NULL,NULL,'2026-10-05T06:36:02.942160+00:00');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settlement_allocations`
--

DROP TABLE IF EXISTS `settlement_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlement_allocations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `umkm_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_type` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settlement_transaction_recipient` (`transaction_id`,`recipient_type`),
  KEY `ix_settlement_allocations_recipient` (`recipient_type`,`recipient_id`),
  KEY `ix_settlement_allocations_status` (`status`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settlement_allocations`
--

LOCK TABLES `settlement_allocations` WRITE;
/*!40000 ALTER TABLE `settlement_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `settlement_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settlement_config`
--

DROP TABLE IF EXISTS `settlement_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlement_config` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `umkm_pct` double NOT NULL,
  `pemkab_pct` double NOT NULL,
  `admin_pct` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settlement_config`
--

LOCK TABLES `settlement_config` WRITE;
/*!40000 ALTER TABLE `settlement_config` DISABLE KEYS */;
INSERT INTO `settlement_config` VALUES ('default',90,8,2);
/*!40000 ALTER TABLE `settlement_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_txn_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `umkm_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cashier_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `items` json NOT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `discount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL,
  `payment_method` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nfc_card_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nonce` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `offline` tinyint(1) NOT NULL DEFAULT '0',
  `sync_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `synced_at` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transactions_umkm_client_txn` (`umkm_id`,`client_txn_id`),
  KEY `ix_transactions_umkm_created` (`umkm_id`,`created_at`),
  KEY `ix_transactions_created` (`created_at`),
  KEY `ix_transactions_nfc_total` (`umkm_id`,`nfc_card_id`,`total`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `umkm_payout_accounts`
--

DROP TABLE IF EXISTS `umkm_payout_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `umkm_payout_accounts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `umkm_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verification_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verified_at` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_umkm_payout_accounts_umkm` (`umkm_id`,`created_at`),
  KEY `ix_umkm_payout_accounts_verification` (`verification_status`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `umkm_payout_accounts`
--

LOCK TABLES `umkm_payout_accounts` WRITE;
/*!40000 ALTER TABLE `umkm_payout_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `umkm_payout_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `umkms`
--

DROP TABLE IF EXISTS `umkms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `umkms` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` text COLLATE utf8mb4_unicode_ci,
  `owner_user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `umkms`
--

LOCK TABLES `umkms` WRITE;
/*!40000 ALTER TABLE `umkms` DISABLE KEYS */;
INSERT INTO `umkms` VALUES ('15c73f21-9761-4856-9c76-2f1fecad7888','Toko Terang Sabu Raijua','Jl. Kelapa Raya No.12, Seba','0812-1111-0001',NULL,'fcddd89f-c9ca-4294-a658-74f78b70dad9',0.00,1,'2026-10-05T06:36:01.623361+00:00'),('55721c6f-9f9d-433a-b56e-99abadc80b88','Ukiran Woodcraft Mbaata','Jl. Ukir No.9, Mbaata','0812-1111-0005',NULL,'69304448-dc7a-4dbe-877b-ba1ef0a76eb2',0.00,1,'2026-10-05T06:36:02.690451+00:00'),('76da9ff5-66f4-47ce-804e-9aa4b247ff38','Snack Kelapa Hawu','Jl. Pantai Hawu No.5','0812-1111-0004',NULL,'3dd08e85-55bf-477b-9160-8a827019af12',0.00,1,'2026-10-05T06:36:02.434965+00:00'),('82619325-e59a-4254-81e7-ef7f14b48fe2','Kopi Lontar Mesara','Jl. Lontar No.7, Mesara','0812-1111-0003',NULL,'f3aa84d4-3eab-407d-bddf-9d2f093045cf',0.00,1,'2026-10-05T06:36:02.139743+00:00'),('9602e285-0bd0-4b73-8863-8e1053f1227b','Tenun Ikat Seba','Jl. Tenun Ikat No.3, Seba','0812-1111-0002',NULL,'465dcadf-4611-470e-ae9a-63e3fb5661bc',0.00,1,'2026-10-05T06:36:01.884947+00:00');
/*!40000 ALTER TABLE `umkms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `umkm_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('21a56c7a-9902-49fc-a7de-f0d7dd932dd4','admin@umkm.id','$2b$12$ijBqRf0V27J9TjxylnCgeewJ2kNqXBUnEXBw5Jcb6sjssFa5C7rge','Super Admin','admin',NULL,'2026-10-05T06:36:01.611556+00:00'),('3dd08e85-55bf-477b-9160-8a827019af12','snack.hawu@umkm.id','$2b$12$w55mVQ7yUsTADTWnOdb.AemTOXKXhp8aUPEvL13pu8AwMRc1WzX0q','Snack Kelapa Hawu','umkm','76da9ff5-66f4-47ce-804e-9aa4b247ff38','2026-10-05T06:36:02.662259+00:00'),('465dcadf-4611-470e-ae9a-63e3fb5661bc','tenun.seba@umkm.id','$2b$12$7xgeplXv5Qnx7ROJR6GZQOyr8d6b.AJbuuvkxgwRqhpNgchJOeYWS','Tenun Ikat Seba','umkm','9602e285-0bd0-4b73-8863-8e1053f1227b','2026-10-05T06:36:02.113789+00:00'),('69304448-dc7a-4dbe-877b-ba1ef0a76eb2','ukiran.mbaata@umkm.id','$2b$12$10WMIeXjfQfH7sddW7xG1Os7zsysKNsMC1ibfYLe6Qlvofi.RswBK','Ukiran Woodcraft Mbaata','umkm','55721c6f-9f9d-433a-b56e-99abadc80b88','2026-10-05T06:36:02.934818+00:00'),('f3aa84d4-3eab-407d-bddf-9d2f093045cf','kopi.mesara@umkm.id','$2b$12$MjzDAM5WejmfNYV8lccLKe6HlikBBMW0J6Z3TymoQ5Y6B.2PTwGrO','Kopi Lontar Mesara','umkm','82619325-e59a-4254-81e7-ef7f14b48fe2','2026-10-05T06:36:02.405256+00:00'),('fcddd89f-c9ca-4294-a658-74f78b70dad9','sinar.raijua@umkm.id','$2b$12$tySP6/ppygT0uHm9pHgqiujtEqzCN5GqBJX84YJCR2YS9Kf9U1K6G','Toko Sinar Raijua','umkm','15c73f21-9761-4856-9c76-2f1fecad7888','2026-10-05T06:36:01.854635+00:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-05 13:55:20
