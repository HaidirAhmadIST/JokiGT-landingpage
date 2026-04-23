-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: data_pak
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `loggable_type` varchar(255) DEFAULT NULL,
  `loggable_id` bigint(20) unsigned DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `category` enum('sistem','admin') NOT NULL DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_user_id_foreign` (`user_id`),
  KEY `activity_logs_loggable_type_loggable_id_index` (`loggable_type`,`loggable_id`),
  KEY `activity_logs_category_index` (`category`),
  KEY `activity_logs_created_at_index` (`created_at`),
  CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Indah','App\\Models\\Perusahaan',2,'{\"nama_perusahaan\":\"PT. Indah\"}','admin','2026-04-07 21:46:32','2026-04-07 21:46:32'),(2,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Mawar','App\\Models\\Perusahaan',1,'{\"nama_perusahaan\":\"PT. Mawar\"}','admin','2026-04-07 21:47:02','2026-04-07 21:47:02'),(3,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Indah.','App\\Models\\Perusahaan',2,'{\"nama_perusahaan\":\"PT. Indah.\"}','admin','2026-04-07 21:47:49','2026-04-07 21:47:49'),(4,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Adil Makmur','App\\Models\\Perusahaan',3,'{\"nama_perusahaan\":\"PT. Adil Makmur\"}','admin','2026-04-07 21:48:24','2026-04-07 21:48:24'),(5,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Panasonic','App\\Models\\Perusahaan',4,'{\"nama_perusahaan\":\"PT. Panasonic\"}','admin','2026-04-07 21:48:58','2026-04-07 21:48:58'),(6,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Berkah','App\\Models\\Perusahaan',6,'{\"nama_perusahaan\":\"PT. Berkah\"}','admin','2026-04-07 21:50:24','2026-04-07 21:50:24'),(7,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Jaya','App\\Models\\Perusahaan',7,'{\"nama_perusahaan\":\"PT. Jaya\"}','admin','2026-04-07 21:50:56','2026-04-07 21:50:56'),(8,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Jaya','App\\Models\\Perusahaan',7,'{\"nama_perusahaan\":\"PT. Jaya\"}','admin','2026-04-07 22:03:38','2026-04-07 22:03:38'),(9,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Maju Jaya','App\\Models\\Perusahaan',5,'{\"nama_perusahaan\":\"PT. Maju Jaya\"}','admin','2026-04-07 22:04:22','2026-04-07 22:04:22'),(10,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Jaya','App\\Models\\Perusahaan',7,'{\"nama_perusahaan\":\"PT. Jaya\"}','admin','2026-04-13 22:12:06','2026-04-13 22:12:06'),(11,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Jaya','App\\Models\\Perusahaan',7,'{\"nama_perusahaan\":\"PT. Jaya\"}','admin','2026-04-13 22:12:12','2026-04-13 22:12:12'),(12,1,'Admin Sistem','update','Admin Sistem memperbarui data PT. Jaya','App\\Models\\Perusahaan',7,'{\"nama_perusahaan\":\"PT. Jaya\"}','admin','2026-04-13 23:41:04','2026-04-13 23:41:04'),(13,1,'Admin Sistem','create','Admin Sistem menambahkan perusahaan PT. Abdi Sejahtera','App\\Models\\Perusahaan',8,'{\"nama_perusahaan\":\"PT. Abdi Sejahtera\"}','admin','2026-04-20 01:15:16','2026-04-20 01:15:16');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel-cache-admin@pak.com|127.0.0.1','i:1;',1774197301),('laravel-cache-admin@pak.com|127.0.0.1:timer','i:1774197301;',1774197301);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detail_medis`
--

DROP TABLE IF EXISTS `detail_medis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detail_medis` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pekerja_id` bigint(20) unsigned NOT NULL,
  `tgl_pemeriksaan` date DEFAULT NULL,
  `tempat_pemeriksa` varchar(255) DEFAULT NULL,
  `jenis_pemeriksa` varchar(255) DEFAULT NULL,
  `dokter_pemeriksa` varchar(255) DEFAULT NULL,
  `hasil_diagnosis` text DEFAULT NULL,
  `golongan_darah` varchar(255) DEFAULT NULL,
  `rhesus` varchar(255) DEFAULT NULL,
  `riwayat_penyakit` text DEFAULT NULL,
  `alergi` text DEFAULT NULL,
  `riwayat_operasi` text DEFAULT NULL,
  `obat_rutin` text DEFAULT NULL,
  `status_kesehatan` enum('sehat','sehat_dengan_catatan','tidak_sehat') NOT NULL DEFAULT 'sehat',
  `rekomendasi` text DEFAULT NULL,
  `pendamping` varchar(255) DEFAULT NULL,
  `file_hasil_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detail_medis_tanggal_pemeriksaan_index` (`tgl_pemeriksaan`),
  KEY `detail_medis_pekerja_id_index` (`pekerja_id`),
  CONSTRAINT `detail_medis_pekerja_id_foreign` FOREIGN KEY (`pekerja_id`) REFERENCES `pekerja` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detail_medis`
--

LOCK TABLES `detail_medis` WRITE;
/*!40000 ALTER TABLE `detail_medis` DISABLE KEYS */;
INSERT INTO `detail_medis` VALUES (1,13,'2026-01-07','klinik Median','Lainnya','Dokter Ausen','DBD',NULL,NULL,NULL,NULL,NULL,NULL,'tidak_sehat',NULL,'Mandiri','medis/medis_1_1776673720.png','2026-04-20 01:28:37','2026-04-20 01:28:40',NULL);
/*!40000 ALTER TABLE `detail_medis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_03_22_140000_create_perusahaan_table',1),(5,'2026_03_22_140100_create_pekerja_table',1),(6,'2026_03_22_140200_create_riwayat_pekerja_table',1),(7,'2026_03_22_140300_create_detail_medis_table',1),(8,'2026_03_22_140400_create_status_advokasi_table',1),(9,'2026_03_22_143244_create_personal_access_tokens_table',2),(10,'2026_03_22_170514_add_contact_info_to_pekerja_table',3),(11,'2026_03_23_142337_add_pic_info_to_perusahaan_table',4),(12,'2026_03_24_143310_add_index_to_pekerja_nama_lengkap',5),(13,'2026_03_24_144602_add_metadata_to_status_advokasi_table',6),(14,'2026_04_01_052407_add_pas_foto_to_pekerja_table',7),(15,'2026_04_02_043600_add_foto_to_pekerja_table',8),(16,'2026_04_02_142745_add_advokasi_file_columns_to_status_advokasi_table',8),(17,'2026_04_06_000001_add_soft_delete_to_perusahaan_table',8),(18,'2026_04_06_000002_create_activity_logs_table',8),(19,'2026_04_09_073458_add_outsourcing_fields_to_riwayat_pekerjaan_table',9),(21,'2026_04_09_080653_create_medical_entities_tables',10),(22,'2026_04_08_192000_add_lion_pic_to_perusahaan_table',11),(23,'2026_04_09_072315_add_upload_timestamps_to_status_advokasi_table',11),(24,'2026_04_11_132218_add_status_kesehatan_to_detail_medis_table',11),(25,'2026_04_11_132245_update_status_kesehatan_enum_in_pekerja_table',11),(26,'2026_04_14_050000_update_status_pendamping_enum_in_perusahaan_table',12),(27,'2026_04_11_133950_sync_detail_medis_table_columns',13),(28,'2026_04_11_134809_change_jenis_pemeriksa_to_string',13),(29,'2026_04_11_142912_add_baseline_fields_to_detail_medis',13),(30,'2026_04_16_113443_add_file_bukti_path_to_riwayat_pekerja_table',13),(31,'2026_04_16_130554_modify_pekerja_table_make_perusahaan_id_nullable',14),(32,'2026_04_16_131602_update_status_kesehatan_to_indonesian_terms',15),(33,'2026_04_20_150000_make_detail_medis_columns_nullable',16),(34,'2026_04_20_151000_add_pendamping_to_detail_medis_table',17),(35,'2026_04_20_153000_add_name_columns_to_status_advokasi_table',18);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pekerja`
--

DROP TABLE IF EXISTS `pekerja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pekerja` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `perusahaan_id` bigint(20) unsigned DEFAULT NULL,
  `nik` varchar(255) NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `status_kesehatan` enum('sehat','sehat_dengan_catatan','tidak_sehat') NOT NULL DEFAULT 'sehat',
  `catatan_admin` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `domisili` text DEFAULT NULL,
  `foto_path` varchar(255) DEFAULT NULL,
  `pas_foto` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pekerja_nik_unique` (`nik`),
  KEY `pekerja_user_id_index` (`user_id`),
  KEY `pekerja_perusahaan_id_index` (`perusahaan_id`),
  KEY `pekerja_status_kesehatan_index` (`status_kesehatan`),
  KEY `pekerja_nama_lengkap_index` (`nama_lengkap`),
  CONSTRAINT `pekerja_perusahaan_id_foreign` FOREIGN KEY (`perusahaan_id`) REFERENCES `perusahaan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pekerja_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pekerja`
--

LOCK TABLES `pekerja` WRITE;
/*!40000 ALTER TABLE `pekerja` DISABLE KEYS */;
INSERT INTO `pekerja` VALUES (1,2,1,'1323121212312312','asadsdadd','sehat',NULL,'2026-03-22 09:32:46','2026-03-23 08:36:54',NULL,'1995-09-12','P',NULL,NULL,NULL,NULL),(2,3,2,'1234444444444444','asssssssss','sehat',NULL,'2026-03-22 09:47:09','2026-03-22 09:47:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,4,4,'7686786786887787','cccccccccccccc','sehat',NULL,'2026-03-22 10:00:55','2026-03-22 10:00:55',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,5,5,'4444444444444444','qqqqqqqqqqqqq','sehat',NULL,'2026-03-22 10:10:54','2026-04-13 21:26:51',NULL,'1998-01-05','L','89876678678678','rrrrrrrrrrrrr',NULL,NULL),(5,6,7,'mmmmmmmmmmmmmmmm','lllllllllllllllllll','sehat',NULL,'2026-03-23 08:20:54','2026-03-23 08:20:54',NULL,'1994-02-09','L','999999999999','jjjjjjjjjjjjjjjjjjjjj',NULL,NULL),(6,7,4,'2323232323232323','haidir','sehat',NULL,'2026-03-31 22:33:18','2026-03-31 22:33:18',NULL,'1998-09-11','L','878785657456','jl musisi no 12 blok b, RT 003 RW 012, Jawa Barat, Kota Bandung.',NULL,NULL),(7,8,2,'2423564683452342','azil','sehat',NULL,'2026-03-31 22:44:07','2026-03-31 22:44:07',NULL,'2005-04-20','L','89677568567','jl Purwakarta No 45, Blok C. Jawa Barat, Kota Bandung',NULL,NULL),(8,9,5,'3235233255156234','Adam','sehat',NULL,'2026-03-31 22:49:23','2026-03-31 22:49:23',NULL,'2000-02-16','L','8785768568568','Jl.Merdeka No 45',NULL,NULL),(9,10,3,'2341524312323452','Mawar','sehat','tidak memiliki BPJS dan Dokumen Tidak Lengkap','2026-03-31 23:11:47','2026-04-19 04:32:11',NULL,'2001-07-12','L','878976647467','jl. Merdeka No 45 Blok F',NULL,'9_1775023908.png'),(13,14,8,'2313413341342321','Bayu Estigo','sehat',NULL,'2026-04-20 01:28:37','2026-04-21 18:57:09',NULL,'2000-07-23','L','08964567345','JL Komplek Bumi Alam Blok C No. 12',NULL,'13_1776673718.png');
/*!40000 ALTER TABLE `pekerja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (10,'App\\Models\\User',1,'auth_token','058e99f191d8eaee21875a1c322dca151b5a47ad8a4f19092064c53f5c55b826','[\"*\"]','2026-04-21 18:57:42',NULL,'2026-04-19 23:23:25','2026-04-21 18:57:42');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perusahaan`
--

DROP TABLE IF EXISTS `perusahaan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `perusahaan` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nama_perusahaan` varchar(255) NOT NULL,
  `sektor_industri` varchar(255) DEFAULT NULL,
  `status_pendamping` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `nama_pic` varchar(255) DEFAULT NULL,
  `kontak_pic` varchar(255) DEFAULT NULL,
  `nama_pic_lion` varchar(255) DEFAULT NULL,
  `nara_hubung_lion` varchar(255) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `perusahaan_nama_perusahaan_index` (`nama_perusahaan`),
  KEY `perusahaan_status_pendamping_index` (`status_pendamping`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perusahaan`
--

LOCK TABLES `perusahaan` WRITE;
/*!40000 ALTER TABLE `perusahaan` DISABLE KEYS */;
INSERT INTO `perusahaan` VALUES (1,'PT. Mawar','Logistik','Berkasus','2026-03-22 08:48:13','2026-04-07 21:47:02',NULL,NULL,NULL,NULL,NULL,NULL),(2,'PT. Indah.','Jasa Pengiriman','Berkasus','2026-03-22 09:36:32','2026-04-07 21:47:49',NULL,NULL,NULL,NULL,NULL,NULL),(3,'PT. Adil Makmur','Produksi','Berkasus','2026-03-22 09:38:15','2026-04-07 21:48:24',NULL,NULL,NULL,NULL,NULL,NULL),(4,'PT. Panasonic','Elektronik','Berkasus','2026-03-22 10:00:54','2026-04-07 21:48:58',NULL,NULL,NULL,NULL,NULL,NULL),(5,'PT. Maju Jaya','Produksi','Berkasus','2026-03-22 10:10:53','2026-04-07 22:04:22',NULL,NULL,NULL,NULL,NULL,NULL),(6,'PT. Berkah','Logistik','Dalam Pantauan','2026-03-23 07:30:55','2026-04-07 21:50:24','ssssssss','gggggggg','88888888',NULL,NULL,NULL),(7,'PT. Jaya','Produksi','Selesai','2026-03-23 08:20:53','2026-04-13 23:41:04','JL. Suka Maju',NULL,NULL,NULL,NULL,NULL),(8,'PT. Abdi Sejahtera','Industri perakitan motor','Dalam Pantauan','2026-04-20 01:15:16','2026-04-20 01:15:16',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `perusahaan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `riwayat_medis`
--

DROP TABLE IF EXISTS `riwayat_medis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `riwayat_medis` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pekerja_id` bigint(20) unsigned NOT NULL,
  `golongan_darah` enum('A','B','AB','O') DEFAULT NULL,
  `rhesus` enum('+','-') DEFAULT NULL,
  `riwayat_penyakit` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`riwayat_penyakit`)),
  `alergi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`alergi`)),
  `riwayat_operasi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`riwayat_operasi`)),
  `obat_rutin` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `riwayat_medis_pekerja_id_unique` (`pekerja_id`),
  CONSTRAINT `riwayat_medis_pekerja_id_foreign` FOREIGN KEY (`pekerja_id`) REFERENCES `pekerja` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `riwayat_medis`
--

LOCK TABLES `riwayat_medis` WRITE;
/*!40000 ALTER TABLE `riwayat_medis` DISABLE KEYS */;
INSERT INTO `riwayat_medis` VALUES (1,13,'B',NULL,'[\"asma\"]','[\"tidak ada\"]','[\"tidak ada\"]','tidak ada','2026-04-20 01:28:37','2026-04-20 01:28:37');
/*!40000 ALTER TABLE `riwayat_medis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `riwayat_pekerja`
--

DROP TABLE IF EXISTS `riwayat_pekerja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `riwayat_pekerja` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pekerja_id` bigint(20) unsigned NOT NULL,
  `status_pekerjaan` varchar(255) DEFAULT NULL,
  `nama_perusahaan` varchar(255) NOT NULL,
  `deskripsi_usaha` varchar(255) DEFAULT NULL,
  `bagian` varchar(255) DEFAULT NULL,
  `jabatan` varchar(255) DEFAULT NULL,
  `deskripsi_pekerjaan` text DEFAULT NULL,
  `tgl_masuk` date DEFAULT NULL,
  `tgl_keluar` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `nama_agen_penyalur` varchar(255) DEFAULT NULL,
  `tanggal_selesai_kontrak` date DEFAULT NULL,
  `file_bukti_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `riwayat_pekerja_pekerja_id_index` (`pekerja_id`),
  CONSTRAINT `riwayat_pekerja_pekerja_id_foreign` FOREIGN KEY (`pekerja_id`) REFERENCES `pekerja` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `riwayat_pekerja`
--

LOCK TABLES `riwayat_pekerja` WRITE;
/*!40000 ALTER TABLE `riwayat_pekerja` DISABLE KEYS */;
INSERT INTO `riwayat_pekerja` VALUES (1,1,NULL,'asasdsa','qweqweqwqw','qweqweqw / qweqweqw',NULL,NULL,'2026-03-10',NULL,'2026-03-22 09:32:46','2026-03-22 09:32:46',NULL,NULL,NULL),(2,1,NULL,'asdsaddasdsad',NULL,'asdasdasdd',NULL,NULL,'2025-08-07','2027-01-06','2026-03-22 09:32:46','2026-03-22 09:32:46',NULL,NULL,NULL),(3,2,NULL,'wwwwwwwwwwwwwww','asdasdasdsas','sadasasa / dsadasddd',NULL,NULL,'2026-04-03',NULL,'2026-03-22 09:47:09','2026-03-22 09:47:09',NULL,NULL,NULL),(4,2,NULL,'wrewer',NULL,'dsdsddf',NULL,NULL,'2026-03-22','2026-03-22','2026-03-22 09:47:09','2026-03-22 09:47:09',NULL,NULL,NULL),(5,3,NULL,'nnnnnnnnnn','sdsadasdsdsss','wwwwww / eeeeee',NULL,NULL,'2026-03-23',NULL,'2026-03-22 10:00:55','2026-03-22 10:00:55',NULL,NULL,NULL),(6,3,NULL,'jjjjjjj',NULL,'hhhhhh',NULL,NULL,'2026-03-23','2026-03-23','2026-03-22 10:00:55','2026-03-22 10:00:55',NULL,NULL,NULL),(7,4,NULL,'maju','biiiii','rreeeee / seeeee',NULL,NULL,'2000-02-09',NULL,'2026-03-22 10:10:54','2026-03-22 10:10:54',NULL,NULL,NULL),(8,4,NULL,'buuuuuu',NULL,'mmmmm',NULL,NULL,'2005-03-17','2020-06-16','2026-03-22 10:10:54','2026-03-22 10:10:54',NULL,NULL,NULL),(9,5,NULL,';;;;;;;;;;;;;llk','ooooooooooooo','uuuuuuuuuuuu / yyyyyyyy',NULL,NULL,'2011-01-16',NULL,'2026-03-23 08:20:54','2026-03-23 08:20:54',NULL,NULL,NULL),(10,5,NULL,'eeeeeeeeeeee',NULL,'wwwwwwwwww',NULL,NULL,'1993-01-05','2006-06-08','2026-03-23 08:20:54','2026-03-23 08:20:54',NULL,NULL,NULL),(11,6,NULL,'nnnnnnnnnn','jasa','Produksi / Operator',NULL,NULL,'2023-05-07',NULL,'2026-03-31 22:33:18','2026-03-31 22:33:18',NULL,NULL,NULL),(12,7,NULL,'wwwwwwwwwwwwwww','Jasa','Logistik / Operator Produksi',NULL,NULL,'2024-07-17',NULL,'2026-03-31 22:44:07','2026-03-31 22:44:07',NULL,NULL,NULL),(13,8,NULL,'maju','Makanan','Produksi / Operator Produksi',NULL,NULL,'2023-06-12',NULL,'2026-03-31 22:49:23','2026-03-31 22:49:23',NULL,NULL,NULL),(14,9,NULL,'sssssssssssssssss','Makanan','Produksi / Operator',NULL,NULL,'2021-03-09',NULL,'2026-03-31 23:11:47','2026-03-31 23:11:47',NULL,NULL,NULL),(27,13,'PKWT','PT. Abdi Sejahtera','Industri perakitan motor','produksi','quality control','cek hasil produksi','2024-05-14',NULL,'2026-04-20 01:28:37','2026-04-20 01:28:37',NULL,NULL,NULL),(28,13,'Outsourcing','PT Logam Mulia',NULL,'marketing','marketing junior',NULL,'2015-03-09','2018-08-10','2026-04-20 01:28:37','2026-04-20 01:28:37','Yayasan Aman Jaya','2018-08-10',NULL),(29,13,'PKWT','PT. Sinar Maju',NULL,'quality control','quality control helper',NULL,'2019-02-01','2022-07-25','2026-04-20 01:28:37','2026-04-20 01:28:39',NULL,NULL,'riwayat/riwayat_29_1776673719.png'),(30,13,'PKWT','PT. Maju Alami',NULL,'Marketing','marketing support',NULL,'2023-09-22','2025-11-20','2026-04-20 01:28:37','2026-04-20 01:28:40',NULL,NULL,'riwayat/riwayat_30_1776673720.png');
/*!40000 ALTER TABLE `riwayat_pekerja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('9Etib4OT61frkECKrOQvp2GtuJc46F6TKxfRgQTc',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRlhOeTBEcmRkQUVjWXBUZG5WVG1NMjA3eDJvRVhxSlhFZGxDcnN4eSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1775095787),('alWzthCVr4nFxe4mHRoCYyL8bCZk1e4fIHT9EtDf',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWXdnZFlCMXA5RThHSUtIeEI4cG9MTHFqZGVTVVJIRDZ0VFc2U0pBRiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1774197602),('GLP19IjODyo3X7Hfsf1wBUWXoBnwIwJ0nJkYXRoj',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiOWozaFdEUk53SE5FTnJheEtsTGFlRXp1NFFpYW5VR2xsUlFrNTRCRyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1774273695),('jvAhxnINY1fxg5y3H6sC3VFvjFY8aEdB0MFMRRe3',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTUowU0ZzQzEzWXlldTBaZW41MlB1clVSSUR5bmdleDJvTG5sellhWSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1775019105),('wO9SqfdjulJyXaqcgihqcwFUTJRIWAHmgWF27anU',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiUWlSQktkd2VsMjg2Qmc4Z3lsRnR5VWk0WU9ON3puYzRNNU5jU1VOeiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1774361548),('YlaeqLtzCcN7b4DfDBk7JAwOfsZCqa2OJ9BSFD7n',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920','YTozOntzOjY6Il90b2tlbiI7czo0MDoiR0g2aUVlaDRodXZBdUJqTVJROUNrdnJvR0E5WldBOFZPcERncE8zWiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1774362864),('yZegoQNuqyIkPbJAfaMZrzeQzlFZm9xoSNB1yhoW',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiN3JKZlhEOW92YkNhaGJMOHBzTUhBcW9QbkI5T0tXOWh1YUxYRWlVcSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1774189623);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_advokasi`
--

DROP TABLE IF EXISTS `status_advokasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `status_advokasi` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pekerja_id` bigint(20) unsigned NOT NULL,
  `jenis_kasus` varchar(255) DEFAULT NULL,
  `tahap` varchar(255) DEFAULT NULL,
  `status_detail` varchar(255) DEFAULT NULL,
  `tanggal_pelaporan` date DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `riwayat_pajanan` tinyint(1) NOT NULL DEFAULT 0,
  `bukti_pajanan_path` varchar(255) DEFAULT NULL,
  `persetujuan_dokter` tinyint(1) NOT NULL DEFAULT 0,
  `perusahaan_lapor` tinyint(1) NOT NULL DEFAULT 0,
  `penetapan_pak` tinyint(1) NOT NULL DEFAULT 0,
  `kompensasi_bpjstk` tinyint(1) NOT NULL DEFAULT 0,
  `rehabilitasi_bpjskes` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `bukti_persetujuan_dokter_path` varchar(255) DEFAULT NULL,
  `bukti_perusahaan_lapor_path` varchar(255) DEFAULT NULL,
  `bukti_penetapan_pak_path` varchar(255) DEFAULT NULL,
  `bukti_kompensasi_bpjstk_path` varchar(255) DEFAULT NULL,
  `bukti_rehabilitasi_bpjskes_path` varchar(255) DEFAULT NULL,
  `bukti_pajanan_at` timestamp NULL DEFAULT NULL,
  `bukti_persetujuan_dokter_at` timestamp NULL DEFAULT NULL,
  `bukti_perusahaan_lapor_at` timestamp NULL DEFAULT NULL,
  `bukti_penetapan_pak_at` timestamp NULL DEFAULT NULL,
  `bukti_kompensasi_bpjstk_at` timestamp NULL DEFAULT NULL,
  `bukti_rehabilitasi_bpjskes_at` timestamp NULL DEFAULT NULL,
  `bukti_pajanan_name` varchar(255) DEFAULT NULL,
  `bukti_persetujuan_dokter_name` varchar(255) DEFAULT NULL,
  `bukti_perusahaan_lapor_name` varchar(255) DEFAULT NULL,
  `bukti_penetapan_pak_name` varchar(255) DEFAULT NULL,
  `bukti_kompensasi_bpjstk_name` varchar(255) DEFAULT NULL,
  `bukti_rehabilitasi_bpjskes_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `status_advokasi_pekerja_id_index` (`pekerja_id`),
  CONSTRAINT `status_advokasi_pekerja_id_foreign` FOREIGN KEY (`pekerja_id`) REFERENCES `pekerja` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_advokasi`
--

LOCK TABLES `status_advokasi` WRITE;
/*!40000 ALTER TABLE `status_advokasi` DISABLE KEYS */;
INSERT INTO `status_advokasi` VALUES (1,1,NULL,NULL,NULL,NULL,NULL,0,'bukti_pajanan/6Sf8AVkDKlaHwMxY1LwLZAQrbNbVVY1nGWKrq1Xl.png',1,1,0,0,0,'2026-03-22 09:32:46','2026-03-22 10:03:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,2,NULL,NULL,NULL,NULL,NULL,0,NULL,0,0,0,0,0,'2026-03-22 09:47:09','2026-03-22 09:47:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,3,NULL,NULL,NULL,NULL,NULL,0,'bukti_pajanan/xRW5vIK3IPcTfWkOj43hhQBJHuUisLszTLQbXwjG.png',0,0,0,0,0,'2026-03-22 10:00:55','2026-03-22 10:03:40',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,4,'pak','bpjs','mediasi_2','2024-07-09','rrrrrrrrrrrrrrrrrr',0,NULL,0,0,0,0,0,'2026-03-22 10:10:54','2026-03-24 07:54:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,5,NULL,NULL,NULL,NULL,NULL,0,NULL,0,0,0,0,0,'2026-03-23 08:20:54','2026-03-24 07:37:14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,6,NULL,NULL,NULL,NULL,NULL,0,NULL,0,0,0,0,0,'2026-03-31 22:33:18','2026-03-31 22:33:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,7,NULL,NULL,NULL,NULL,NULL,0,NULL,0,0,0,0,0,'2026-03-31 22:44:07','2026-03-31 22:44:07',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,8,NULL,NULL,NULL,NULL,NULL,0,NULL,0,0,0,0,0,'2026-03-31 22:49:23','2026-03-31 22:49:23',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,9,NULL,NULL,NULL,NULL,NULL,0,'bukti_advokasi/Pa1o04VPXXKJn7XYcTwW3qc9gdQCwCGyaSvGQ5HT.png',0,0,0,0,0,'2026-03-31 23:11:47','2026-04-13 21:46:13',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,13,NULL,NULL,NULL,NULL,NULL,0,NULL,0,0,0,0,0,'2026-04-20 01:28:37','2026-04-20 01:28:37',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `status_advokasi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','petugas','viewer') NOT NULL DEFAULT 'viewer',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin Sistem','admin@pak.com',NULL,'$2y$12$NIyMHBGERMYeoHfGqnrbduCdXueE2hVMJY49jZRirwr/Ve7ZevDUS','admin',NULL,'2026-03-22 08:30:27','2026-03-24 07:17:48'),(2,'asadsdadd','sasdasdas@gmail.com',NULL,'$2y$12$uJQA64otwm7xykd3audqCuQiCZWHqh8A7Pc.jhBVcMctB2ePJF.uO','viewer',NULL,'2026-03-22 09:32:46','2026-03-22 09:32:46'),(3,'asssssssss','sadasaasd@gmail.com',NULL,'$2y$12$0YxteAe6FiIZxzKoe7qPIeD5ppQ3sV8zABA.GV3vOBp2LEhz4zMea','viewer',NULL,'2026-03-22 09:47:09','2026-03-22 09:47:09'),(4,'cccccccccccccc','sasar@gmail.com',NULL,'$2y$12$U.cmGx4Is9hFmqz6G9iLs.cWrviO8/MVebkNXseOdHLNAIaxxMQgS','viewer',NULL,'2026-03-22 10:00:55','2026-03-22 10:00:55'),(5,'qqqqqqqqqqqqq','aasd@gmail.com',NULL,'$2y$12$VcRLve3drXstuM4PLY3jguGqNnv/tgtiUaXPuU7ub7Mi6pdmnT2/i','viewer',NULL,'2026-03-22 10:10:54','2026-03-22 10:10:54'),(6,'lllllllllllllllllll','sasds!@hgj.com',NULL,'$2y$12$AiDB953wXSL0/F/0lCbqhOubc6foFlh1X7sKGxGychZDdrWJ4AFDW','viewer',NULL,'2026-03-23 08:20:54','2026-03-23 08:20:54'),(7,'haidir','haidir@gmaial.com',NULL,'$2y$12$rSfhYEPCpD7d2AAesDGUTOBwTiel3bclya3vKzcjx88NICW8OTJ6e','viewer',NULL,'2026-03-31 22:33:18','2026-03-31 22:33:18'),(8,'azil','azil@gmail.com',NULL,'$2y$12$lIUFTxtNYRrj6d1VgBEdt.2zlqekJb47ROM1eJT2CFkEI01l15SXS','viewer',NULL,'2026-03-31 22:44:07','2026-03-31 22:44:07'),(9,'Adam','adam@gmail.com',NULL,'$2y$12$JziUKe2MC/sQEay5FOSzXeci9zHjMxaZVvd5vjHD1Id0Nvx9iF/0e','viewer',NULL,'2026-03-31 22:49:23','2026-03-31 22:49:23'),(10,'Mawar','mawar@gmail.com',NULL,'$2y$12$E4m5lypGZCCixblFDPHUWOMVDx.e4Ylp3LTsw4DHNm7RajMcGFwfm','viewer',NULL,'2026-03-31 23:11:47','2026-03-31 23:11:47'),(14,'Bayu Estigo','bayu@gmail.com',NULL,'$2y$12$H1yTEJH3orvuxfr82tOs0ev07MNQJuwB0KGab9uYj.ZYdpcW3eqIi','viewer',NULL,'2026-04-20 01:28:37','2026-04-20 01:28:37');
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

-- Dump completed on 2026-04-22  9:06:47
