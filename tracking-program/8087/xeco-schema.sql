-- MySQL dump 10.13  Distrib 5.7.33, for Linux (x86_64)
--
-- Host: localhost    Database: xeco
-- ------------------------------------------------------
-- Server version	5.7.27-0ubuntu0.16.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `InventoryPart`
--

DROP TABLE IF EXISTS `InventoryPart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InventoryPart` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `addedondata` datetime(6) DEFAULT NULL,
  `updatedondate` datetime(6) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `softwareVersion` varchar(255) DEFAULT NULL,
  `isDeleted` int(11) DEFAULT NULL,
  `costPerUnit` double DEFAULT NULL,
  `unitCode` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_deleted_xuids`
--

DROP TABLE IF EXISTS `_deleted_xuids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_deleted_xuids` (
  `table` varchar(100) NOT NULL,
  `xuid` varchar(36) NOT NULL,
  `deletedAt` bigint(20) NOT NULL,
  PRIMARY KEY (`xuid`),
  KEY `timestamp` (`deletedAt`),
  KEY `table` (`table`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_device_history`
--

DROP TABLE IF EXISTS `_device_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_device_history` (
  `operation` enum('Insert','Delete') NOT NULL,
  `device` enum('switch','meter','gateway') NOT NULL,
  `id` int(11) NOT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `time` bigint(20) DEFAULT NULL,
  KEY `operation` (`operation`),
  KEY `device` (`device`),
  KEY `id` (`id`),
  KEY `xuid` (`xuid`),
  KEY `name` (`name`),
  KEY `meshId` (`meshId`),
  KEY `deviceId` (`deviceId`),
  KEY `project` (`project`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_sync_status`
--

DROP TABLE IF EXISTS `_sync_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_sync_status` (
  `host` varchar(200) NOT NULL,
  `table` varchar(100) NOT NULL,
  `lastSyncPoint` bigint(20) NOT NULL DEFAULT '0',
  `refId` bigint(20) NOT NULL DEFAULT '0',
  UNIQUE KEY `PK` (`host`,`table`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `client` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `legalName` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `contactName` varchar(255) DEFAULT NULL,
  `contactTitle` varchar(255) DEFAULT NULL,
  `contactPhone` varchar(255) DEFAULT NULL,
  `marketSegment` varchar(255) DEFAULT NULL,
  `taxId` varchar(255) DEFAULT NULL,
  `shippingTerms` varchar(255) DEFAULT NULL,
  `salesTax` double DEFAULT NULL,
  `financeEmail` varchar(255) DEFAULT NULL,
  `financePhone` varchar(255) DEFAULT NULL,
  `managerName` varchar(255) DEFAULT NULL,
  `managerCertificate` varchar(255) DEFAULT NULL,
  `managerPhone` varchar(255) DEFAULT NULL,
  `managerEmail` varchar(255) DEFAULT NULL,
  `managerLocation` varchar(255) DEFAULT NULL,
  `logoImgSrc` varchar(255) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=4917 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_client
BEFORE INSERT ON client
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_client
AFTER DELETE ON client
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("client", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `deployments`
--

DROP TABLE IF EXISTS `deployments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deployments` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `clientId` int(11) DEFAULT '0',
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Tracks deployments of devices for a given client on a start date';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detailedBillAnalysis`
--

DROP TABLE IF EXISTS `detailedBillAnalysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detailedBillAnalysis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `analysisName` varchar(255) DEFAULT NULL,
  `analysisDate` date DEFAULT NULL,
  `billReference` varchar(255) DEFAULT NULL,
  `billDate` date DEFAULT NULL,
  `electricCompany` varchar(255) DEFAULT NULL,
  `electricCoAddress` varchar(255) DEFAULT NULL,
  `electricCoAccount` varchar(255) DEFAULT NULL,
  `squareFootage` float DEFAULT NULL,
  `totalKWH` float DEFAULT NULL,
  `numberOfMeters` int(11) DEFAULT NULL,
  `switchGears` int(11) DEFAULT NULL,
  `mainCircuits` int(11) DEFAULT NULL,
  `totalBilled` float DEFAULT NULL,
  `daysBilled` int(11) DEFAULT NULL,
  `kwRate` float DEFAULT NULL,
  `kvarTariff` float DEFAULT NULL,
  `totalTariff` float DEFAULT NULL,
  `kwPeak` float DEFAULT NULL,
  `customerCharge` float DEFAULT NULL,
  `kvaSavings` float DEFAULT NULL,
  `kwhSavings` float DEFAULT NULL,
  `xecoReduction` float DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detailedBillLine`
--

DROP TABLE IF EXISTS `detailedBillLine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detailedBillLine` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `kwLineItem` double DEFAULT NULL,
  `cost` double DEFAULT NULL,
  `kwPeak` double DEFAULT NULL,
  `units` varchar(255) DEFAULT NULL,
  `meter` double DEFAULT NULL,
  `rate` double DEFAULT NULL,
  `total` double DEFAULT NULL,
  `analysisKey_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_de54fa62` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipmentdata`
--

DROP TABLE IF EXISTS `equipmentdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipmentdata` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recordedAt` double DEFAULT NULL,
  `day` varchar(255) DEFAULT NULL,
  `minute` double DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `l1Volt` double DEFAULT NULL,
  `l1Amp` double DEFAULT NULL,
  `l1Kw` double DEFAULT NULL,
  `l1Kva` double DEFAULT NULL,
  `l1Pf` double DEFAULT NULL,
  `l1Kvar` double DEFAULT NULL,
  `l2Volt` double DEFAULT NULL,
  `l2Amp` double DEFAULT NULL,
  `l2Kw` double DEFAULT NULL,
  `l2Kva` double DEFAULT NULL,
  `l2Pf` double DEFAULT NULL,
  `l2Kvar` double DEFAULT NULL,
  `l3Volt` double DEFAULT NULL,
  `l3Amp` double DEFAULT NULL,
  `l3Kw` double DEFAULT NULL,
  `l3Kva` double DEFAULT NULL,
  `l3Pf` double DEFAULT NULL,
  `l3Kvar` double DEFAULT NULL,
  `totalVolt` double DEFAULT NULL,
  `totalAmp` double DEFAULT NULL,
  `totalKw` double DEFAULT NULL,
  `totalKva` double DEFAULT NULL,
  `totalPf` double DEFAULT NULL,
  `totalKvar` double DEFAULT NULL,
  `l1VoltTHD` double DEFAULT NULL,
  `l2VoltTHD` double DEFAULT NULL,
  `l3VoltTHD` double DEFAULT NULL,
  `l1AmpTHD` double DEFAULT NULL,
  `l2AmpTHD` double DEFAULT NULL,
  `l3AmpTHD` double DEFAULT NULL,
  `totalVoltTHD` double DEFAULT NULL,
  `totalAmpTHD` double DEFAULT NULL,
  `switch` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `uniq_idx` (`switch`,`recordedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipmentdataaggregate`
--

DROP TABLE IF EXISTS `equipmentdataaggregate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipmentdataaggregate` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` varchar(255) DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `numSamples` double DEFAULT NULL,
  `intervalStartTime` double DEFAULT NULL,
  `intervalEndTime` double DEFAULT NULL,
  `avgVolt` double DEFAULT NULL,
  `avgAmp` double DEFAULT NULL,
  `avgKw` double DEFAULT NULL,
  `avgKva` double DEFAULT NULL,
  `avgPf` double DEFAULT NULL,
  `avgKvar` double DEFAULT NULL,
  `avgVoltTHD` double DEFAULT NULL,
  `avgAmpTHD` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `peakKw` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `projday_idx` (`project`,`day`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `file`
--

DROP TABLE IF EXISTS `file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `file` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `description` longtext,
  `project` int(11) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gateway`
--

DROP TABLE IF EXISTS `gateway`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gateway` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `softwareVersion` varchar(255) DEFAULT NULL,
  `lastCommunicatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `meshIp` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=82182 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_gateway
BEFORE INSERT ON gateway
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger _gateway_history_insert
AFTER INSERT ON gateway
FOR EACH ROW
  INSERT INTO _device_history (operation, device, id, xuid, name, meshId, deviceId, project, time) VALUES ('Insert', 'gateway', NEW.id, NEW.xuid, NEW.name, NEW.meshId, NEW.deviceId, NEW.project, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_gateway
AFTER DELETE ON gateway
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("gateway", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger _gateway_history_delete
AFTER DELETE ON gateway
FOR EACH ROW
  INSERT INTO _device_history (operation, device, id, xuid, name, meshId, deviceId, project, time) VALUES ('Delete', 'gateway', OLD.id, OLD.xuid, OLD.name, OLD.meshId, OLD.deviceId, OLD.project, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `gateway_tests__test_gateways`
--

DROP TABLE IF EXISTS `gateway_tests__test_gateways`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gateway_tests__test_gateways` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `gateway_tests` int(11) DEFAULT NULL,
  `test_gateways` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_gateway_tests__test_gateways
BEFORE INSERT ON gateway_tests__test_gateways
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_gateway_tests__test_gateways
BEFORE INSERT ON gateway_tests__test_gateways
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_gateway_tests__test_gateways
AFTER DELETE ON gateway_tests__test_gateways
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("gateway_tests__test_gateways", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `gatewaycommand`
--

DROP TABLE IF EXISTS `gatewaycommand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gatewaycommand` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `commandType` double DEFAULT NULL,
  `startAt` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `test` int(11) DEFAULT NULL,
  `isCancelled` tinyint(1) DEFAULT '0',
  `duration` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_gatewaycommand
BEFORE INSERT ON gatewaycommand
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_gatewaycommand
AFTER DELETE ON gatewaycommand
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("gatewaycommand", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `knex_migrations`
--

DROP TABLE IF EXISTS `knex_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `knex_migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `knex_migrations_lock`
--

DROP TABLE IF EXISTS `knex_migrations_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `knex_migrations_lock` (
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meter`
--

DROP TABLE IF EXISTS `meter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meter` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `lastCommunicatedAt` double DEFAULT NULL,
  `meshLastCommunicatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `lastL1Volt` double DEFAULT NULL,
  `lastL1Amp` double DEFAULT NULL,
  `lastL1Kw` double DEFAULT NULL,
  `lastL1Kva` double DEFAULT NULL,
  `lastL1Pf` double DEFAULT NULL,
  `lastL1Kvar` double DEFAULT NULL,
  `lastL2Volt` double DEFAULT NULL,
  `lastL2Amp` double DEFAULT NULL,
  `lastL2Kw` double DEFAULT NULL,
  `lastL2Kva` double DEFAULT NULL,
  `lastL2Pf` double DEFAULT NULL,
  `lastL2Kvar` double DEFAULT NULL,
  `lastL3Volt` double DEFAULT NULL,
  `lastL3Amp` double DEFAULT NULL,
  `lastL3Kw` double DEFAULT NULL,
  `lastL3Kva` double DEFAULT NULL,
  `lastL3Pf` double DEFAULT NULL,
  `lastL3Kvar` double DEFAULT NULL,
  `lastTotalVolt` double DEFAULT NULL,
  `lastTotalAmp` double DEFAULT NULL,
  `lastTotalKw` double DEFAULT NULL,
  `lastTotalKva` double DEFAULT NULL,
  `lastTotalPf` double DEFAULT NULL,
  `lastTotalKvar` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `meterSerialNumber` varchar(255) DEFAULT NULL,
  `peakTime` varchar(255) DEFAULT NULL,
  `lastMonthKwh` double DEFAULT '0',
  `lastMonthPeak` double DEFAULT '0',
  `todayKwh` double DEFAULT '0',
  `lastKwh` double DEFAULT '0',
  `weekKwh` double DEFAULT '0',
  `gateway` varchar(255) DEFAULT NULL,
  `lastTimestamp` bigint(20) DEFAULT NULL,
  `monthKwh` double DEFAULT '0',
  `avg15MinuteKva` double DEFAULT '0',
  `monthPeak` double DEFAULT '0',
  `lastMonthSavings` double DEFAULT '0',
  `lastMonthBudget` double DEFAULT '0',
  `yearSavings` double DEFAULT '0',
  `lastYearSavings` double DEFAULT '0',
  `projectSavings` double DEFAULT '0',
  `monthI2RLoss` double DEFAULT '0',
  `lastMonthI2RLoss` double DEFAULT '0',
  `yearI2RLoss` double DEFAULT '0',
  `lastYearI2RLoss` double DEFAULT '0',
  `projectI2RLoss` double DEFAULT '0',
  `todayI2RLoss` double DEFAULT '0',
  `weekI2RLoss` double DEFAULT '0',
  `kwhSavings` double DEFAULT '0',
  `kwPeakSavings` double DEFAULT '0',
  `meshIp` varchar(255) DEFAULT NULL,
  `isReporting` tinyint(1) DEFAULT '0',
  `isSub` tinyint(1) DEFAULT '0',
  `isMain` tinyint(1) DEFAULT '1',
  `isFilter` tinyint(1) DEFAULT '0',
  `multiplier` double DEFAULT '1',
  `outputAmp` double DEFAULT '0',
  `lastOutputAmp` double DEFAULT '0',
  `lastTotalTHD` double DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=236417 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_meter
BEFORE INSERT ON meter
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger _meter_history_insert
AFTER INSERT ON meter
FOR EACH ROW
  INSERT INTO _device_history (operation, device, id, xuid, name, meshId, deviceId, project, time) VALUES ('Insert', 'meter', NEW.id, NEW.xuid, NEW.name, NEW.meshId, NEW.deviceId, NEW.project, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_meter
AFTER DELETE ON meter
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("meter", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger _meter_history_delete
AFTER DELETE ON meter
FOR EACH ROW
  INSERT INTO _device_history (operation, device, id, xuid, name, meshId, deviceId, project, time) VALUES ('Delete', 'meter', OLD.id, OLD.xuid, OLD.name, OLD.meshId, OLD.deviceId, OLD.project, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `meter_meters_meter__metercsv_meters`
--

DROP TABLE IF EXISTS `meter_meters_meter__metercsv_meters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meter_meters_meter__metercsv_meters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `metercsv_meters` int(11) DEFAULT NULL,
  `meter_meters_meter` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=1557 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_meter_meters_meter__metercsv_meters
BEFORE INSERT ON meter_meters_meter__metercsv_meters
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_meter_meters_meter__metercsv_meters
BEFORE INSERT ON meter_meters_meter__metercsv_meters
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_meter_meters_meter__metercsv_meters
AFTER DELETE ON meter_meters_meter__metercsv_meters
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("meter_meters_meter__metercsv_meters", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `meteralert`
--

DROP TABLE IF EXISTS `meteralert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meteralert` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `triggerNotificationOn` double DEFAULT NULL,
  `lastNotificationsSent` double DEFAULT NULL,
  `meter` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_meteralert
BEFORE INSERT ON meteralert
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_meteralert
AFTER DELETE ON meteralert
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("meteralert", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `meteralertevent`
--

DROP TABLE IF EXISTS `meteralertevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meteralertevent` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `meter` int(11) DEFAULT NULL,
  `alertGroup` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_meteralertevent
BEFORE INSERT ON meteralertevent
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_meteralertevent
AFTER DELETE ON meteralertevent
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("meteralertevent", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `meteralertgroup`
--

DROP TABLE IF EXISTS `meteralertgroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meteralertgroup` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `alertType` double DEFAULT NULL,
  `threshold` double DEFAULT NULL,
  `delay` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `note` varchar(255) DEFAULT 'false',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_meteralertgroup
BEFORE INSERT ON meteralertgroup
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_meteralertgroup
AFTER DELETE ON meteralertgroup
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("meteralertgroup", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `meteralertgroup_users__user_meterAlertGroups`
--

DROP TABLE IF EXISTS `meteralertgroup_users__user_meterAlertGroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meteralertgroup_users__user_meterAlertGroups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meteralertgroup_users` int(11) DEFAULT NULL,
  `user_meterAlertGroups` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_meteralertgroup_users__user_meterAlertGroups
BEFORE INSERT ON meteralertgroup_users__user_meterAlertGroups
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_meteralertgroup_users__user_meterAlertGroups
BEFORE INSERT ON meteralertgroup_users__user_meterAlertGroups
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_meteralertgroup_users__user_meterAlertGroups
AFTER DELETE ON meteralertgroup_users__user_meterAlertGroups
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("meteralertgroup_users__user_meterAlertGroups", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `metercsv`
--

DROP TABLE IF EXISTS `metercsv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metercsv` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `reportType` double DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  `fromDate` double DEFAULT NULL,
  `toDate` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=665 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_metercsv
BEFORE INSERT ON metercsv
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_metercsv
AFTER DELETE ON metercsv
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("metercsv", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `metercsv_users__user_users_user`
--

DROP TABLE IF EXISTS `metercsv_users__user_users_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `metercsv_users__user_users_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `metercsv_users` int(11) DEFAULT NULL,
  `user_users_user` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=246 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_metercsv_users__user_users_user
BEFORE INSERT ON metercsv_users__user_users_user
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_metercsv_users__user_users_user
BEFORE INSERT ON metercsv_users__user_users_user
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_metercsv_users__user_users_user
AFTER DELETE ON metercsv_users__user_users_user
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("metercsv_users__user_users_user", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `meterdata`
--

DROP TABLE IF EXISTS `meterdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meterdata` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `recordedAt` double DEFAULT NULL,
  `day` varchar(255) DEFAULT NULL,
  `minute` double DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `knownRead` tinyint(1) DEFAULT NULL,
  `l1Volt` double DEFAULT NULL,
  `l1Amp` double DEFAULT NULL,
  `l1Kw` double DEFAULT NULL,
  `l1Kva` double DEFAULT NULL,
  `l1Pf` double DEFAULT NULL,
  `l1THD` double DEFAULT NULL,
  `l1Kvar` double DEFAULT NULL,
  `l2Volt` double DEFAULT NULL,
  `l2Amp` double DEFAULT NULL,
  `l2Kw` double DEFAULT NULL,
  `l2Kva` double DEFAULT NULL,
  `l2Pf` double DEFAULT NULL,
  `l2THD` double DEFAULT NULL,
  `l2Kvar` double DEFAULT NULL,
  `l3Volt` double DEFAULT NULL,
  `l3Amp` double DEFAULT NULL,
  `l3Kw` double DEFAULT NULL,
  `l3Kva` double DEFAULT NULL,
  `l3Pf` double DEFAULT NULL,
  `l3THD` double DEFAULT NULL,
  `l3Kvar` double DEFAULT NULL,
  `totalVolt` double DEFAULT NULL,
  `totalAmp` double DEFAULT NULL,
  `totalKw` double DEFAULT NULL,
  `totalKva` double DEFAULT NULL,
  `totalPf` double DEFAULT NULL,
  `totalTHD` double DEFAULT NULL,
  `totalKvar` double DEFAULT NULL,
  `rawData` longtext,
  `meter` int(11) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `outputAmp` double DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_idx` (`meter`,`recordedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=125680183 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meterdata_clone`
--

DROP TABLE IF EXISTS `meterdata_clone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meterdata_clone` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recordedAt` double DEFAULT NULL,
  `day` varchar(255) DEFAULT NULL,
  `minute` double DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `knownRead` tinyint(1) DEFAULT NULL,
  `l1Volt` double DEFAULT NULL,
  `l1Amp` double DEFAULT NULL,
  `l1Kw` double DEFAULT NULL,
  `l1Kva` double DEFAULT NULL,
  `l1Pf` double DEFAULT NULL,
  `l1Kvar` double DEFAULT NULL,
  `l2Volt` double DEFAULT NULL,
  `l2Amp` double DEFAULT NULL,
  `l2Kw` double DEFAULT NULL,
  `l2Kva` double DEFAULT NULL,
  `l2Pf` double DEFAULT NULL,
  `l2Kvar` double DEFAULT NULL,
  `l3Volt` double DEFAULT NULL,
  `l3Amp` double DEFAULT NULL,
  `l3Kw` double DEFAULT NULL,
  `l3Kva` double DEFAULT NULL,
  `l3Pf` double DEFAULT NULL,
  `l3Kvar` double DEFAULT NULL,
  `totalVolt` double DEFAULT NULL,
  `totalAmp` double DEFAULT NULL,
  `totalKw` double DEFAULT NULL,
  `totalKva` double DEFAULT NULL,
  `totalPf` double DEFAULT NULL,
  `totalKvar` double DEFAULT NULL,
  `rawData` longtext,
  `meter` int(11) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `uniq_idx` (`meter`,`recordedAt`),
  UNIQUE KEY `noMultiples` (`day`,`minute`,`intervalId`,`meter`),
  KEY `meter_idx` (`meter`)
) ENGINE=InnoDB AUTO_INCREMENT=3802462 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meterdata_conversion`
--

DROP TABLE IF EXISTS `meterdata_conversion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meterdata_conversion` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recordedAt` double DEFAULT NULL,
  `day` varchar(255) DEFAULT NULL,
  `minute` double DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `knownRead` tinyint(1) DEFAULT NULL,
  `l1Volt` double DEFAULT NULL,
  `l1Amp` double DEFAULT NULL,
  `l1Kw` double DEFAULT NULL,
  `l1Kva` double DEFAULT NULL,
  `l1Pf` double DEFAULT NULL,
  `l1THD` double DEFAULT NULL,
  `l1Kvar` double DEFAULT NULL,
  `l2Volt` double DEFAULT NULL,
  `l2Amp` double DEFAULT NULL,
  `l2Kw` double DEFAULT NULL,
  `l2Kva` double DEFAULT NULL,
  `l2Pf` double DEFAULT NULL,
  `l2THD` double DEFAULT NULL,
  `l2Kvar` double DEFAULT NULL,
  `l3Volt` double DEFAULT NULL,
  `l3Amp` double DEFAULT NULL,
  `l3Kw` double DEFAULT NULL,
  `l3Kva` double DEFAULT NULL,
  `l3Pf` double DEFAULT NULL,
  `l3THD` double DEFAULT NULL,
  `l3Kvar` double DEFAULT NULL,
  `totalVolt` double DEFAULT NULL,
  `totalAmp` double DEFAULT NULL,
  `totalKw` double DEFAULT NULL,
  `totalKva` double DEFAULT NULL,
  `totalPf` double DEFAULT NULL,
  `totalTHD` double DEFAULT NULL,
  `totalKvar` double DEFAULT NULL,
  `rawData` longtext,
  `meter` int(11) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `uniq_idx` (`meter`,`recordedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meterdataaggregate`
--

DROP TABLE IF EXISTS `meterdataaggregate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meterdataaggregate` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` varchar(255) DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `numSamples` double DEFAULT NULL,
  `intervalStartTime` double DEFAULT NULL,
  `intervalEndTime` double DEFAULT NULL,
  `avgVolt` double DEFAULT NULL,
  `avgAmp` double DEFAULT NULL,
  `avgKw` double DEFAULT NULL,
  `avgKva` double DEFAULT NULL,
  `avgPf` double DEFAULT NULL,
  `avgKvar` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `peakKw` double DEFAULT NULL,
  `multiplier` double DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `projday_idx` (`project`,`day`)
) ENGINE=InnoDB AUTO_INCREMENT=2269040 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meterdataaggregate_old`
--

DROP TABLE IF EXISTS `meterdataaggregate_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meterdataaggregate_old` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` varchar(255) DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `numSamples` double DEFAULT NULL,
  `intervalStartTime` double DEFAULT NULL,
  `intervalEndTime` double DEFAULT NULL,
  `avgVolt` double DEFAULT NULL,
  `avgAmp` double DEFAULT NULL,
  `avgKw` double DEFAULT NULL,
  `avgKva` double DEFAULT NULL,
  `avgPf` double DEFAULT NULL,
  `avgKvar` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `peakKw` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `projday_idx` (`project`,`day`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=47607549 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permeterdataaggregate`
--

DROP TABLE IF EXISTS `permeterdataaggregate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permeterdataaggregate` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `day` varchar(255) DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `numSamples` double DEFAULT NULL,
  `intervalStartTime` double DEFAULT NULL,
  `intervalEndTime` double DEFAULT NULL,
  `meter` int(11) DEFAULT NULL,
  `avgVolt` double DEFAULT NULL,
  `avgAmp` double DEFAULT NULL,
  `avgKw` double DEFAULT NULL,
  `avgKva` double DEFAULT NULL,
  `avgPf` double DEFAULT NULL,
  `avgKvar` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `peakKw` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `projday_idx` (`project`,`day`)
) ENGINE=InnoDB AUTO_INCREMENT=6545317 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permeterdataaggregate_old`
--

DROP TABLE IF EXISTS `permeterdataaggregate_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permeterdataaggregate_old` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` varchar(255) DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `numSamples` double DEFAULT NULL,
  `intervalStartTime` double DEFAULT NULL,
  `intervalEndTime` double DEFAULT NULL,
  `meter` int(11) DEFAULT NULL,
  `avgVolt` double DEFAULT NULL,
  `avgAmp` double DEFAULT NULL,
  `avgKw` double DEFAULT NULL,
  `avgKva` double DEFAULT NULL,
  `avgPf` double DEFAULT NULL,
  `avgKvar` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `peakKw` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `projday_idx` (`project`,`day`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=27027196 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `piboard`
--

DROP TABLE IF EXISTS `piboard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `piboard` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `softwareVersion` varchar(255) DEFAULT NULL,
  `lastCommunicatedAt` double DEFAULT NULL,
  `switchState` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `piboard_deviceid_unique` (`deviceId`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=519525 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_piboard
BEFORE INSERT ON piboard
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_piboard
AFTER DELETE ON piboard
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("piboard", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `project`
--

DROP TABLE IF EXISTS `project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `proposalNumber` varchar(255) DEFAULT NULL,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  `workOrder` varchar(255) DEFAULT NULL,
  `purchaseOrder` varchar(255) DEFAULT NULL,
  `depositAmount` double DEFAULT NULL,
  `discount` double DEFAULT NULL,
  `totalCost` double DEFAULT NULL,
  `salesTax` double DEFAULT NULL,
  `startDate` varchar(255) DEFAULT NULL,
  `timeZoneId` varchar(255) DEFAULT NULL,
  `lastRollupAt` double DEFAULT NULL,
  `electricBillAnalysisUpdatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `documentShareToken` varchar(255) DEFAULT NULL,
  `proposalSrc` varchar(255) DEFAULT NULL,
  `depositInvoiceSrc` varchar(255) DEFAULT NULL,
  `finalInvoiceSrc` varchar(255) DEFAULT NULL,
  `installationInvoiceSrc` varchar(255) DEFAULT NULL,
  `kwPeakSavings` double DEFAULT NULL,
  `pfSavings` double DEFAULT NULL,
  `kvarSavings` double DEFAULT NULL,
  `kvaSavings` double DEFAULT NULL,
  `kwhSavings` double DEFAULT NULL,
  `avg15MinuteKva` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `electricBillAnalysis` longtext,
  `equipmentInfo` longtext,
  `client` int(11) DEFAULT NULL,
  `xecoManager` int(11) DEFAULT NULL,
  `currencyCode` varchar(255) DEFAULT 'USD',
  `carbonCreditRate` double DEFAULT '11',
  `slug` varchar(255) DEFAULT NULL,
  `reportFields` text,
  `gwControl` tinyint(1) DEFAULT '0',
  `avg15MinuteKw` double DEFAULT NULL,
  `selectedTest` int(11) DEFAULT NULL,
  `servicePlan` int(11) DEFAULT NULL,
  `lastBudget` longtext,
  `lastBudgetInvoice` longtext,
  `lastRecordedTime` bigint(20) DEFAULT NULL,
  `kwhRate` double DEFAULT '0',
  `kwRate` double DEFAULT '0',
  `lastKwh` double DEFAULT '0',
  `taxRate` double DEFAULT '0',
  `totalAmpLoad` double DEFAULT '0',
  `lastTotalPf` double DEFAULT '100',
  `initialPf` double DEFAULT '100',
  `currencyExchangeCharge` double DEFAULT '0',
  `currencyExchangeRate` double DEFAULT '1',
  `subNeeded` tinyint(1) DEFAULT '0',
  `subStartDate` varchar(255) DEFAULT NULL,
  `multiplier` double DEFAULT '1',
  `peakMultiplier` double DEFAULT '1',
  `ILRatio` double DEFAULT '100',
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `lowAmpsThreshold` decimal(10,0) DEFAULT NULL,
  `highAmpsThreshold` decimal(10,0) DEFAULT NULL,
  `lastThresholdSwitchState` varchar(10) DEFAULT NULL,
  `slackChannel` decimal(10,0) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `servicePlan` (`servicePlan`)
) ENGINE=InnoDB AUTO_INCREMENT=915 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_old`
--

DROP TABLE IF EXISTS `project_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_old` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `proposalNumber` varchar(255) DEFAULT NULL,
  `invoiceNumber` longtext,
  `workOrder` varchar(255) DEFAULT NULL,
  `purchaseOrder` varchar(255) DEFAULT NULL,
  `depositAmount` double DEFAULT NULL,
  `discount` double DEFAULT NULL,
  `totalCost` double DEFAULT NULL,
  `salesTax` double DEFAULT NULL,
  `startDate` varchar(255) DEFAULT NULL,
  `timeZoneId` varchar(255) DEFAULT NULL,
  `lastRollupAt` double DEFAULT NULL,
  `electricBillAnalysisUpdatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `documentShareToken` varchar(255) DEFAULT NULL,
  `proposalSrc` varchar(255) DEFAULT NULL,
  `depositInvoiceSrc` varchar(255) DEFAULT NULL,
  `finalInvoiceSrc` varchar(255) DEFAULT NULL,
  `installationInvoiceSrc` varchar(255) DEFAULT NULL,
  `kwPeakSavings` double DEFAULT NULL,
  `pfSavings` double DEFAULT NULL,
  `kvarSavings` double DEFAULT NULL,
  `kvaSavings` double DEFAULT NULL,
  `kwhSavings` double DEFAULT NULL,
  `avg15MinuteKva` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `electricBillAnalysis` longtext,
  `equipmentInfo` longtext,
  `client` int(11) DEFAULT NULL,
  `xecoManager` int(11) DEFAULT NULL,
  `currencyCode` varchar(255) DEFAULT 'USD',
  `carbonCreditRate` double DEFAULT '11',
  `slug` varchar(255) DEFAULT NULL,
  `reportFields` text,
  `gwControl` tinyint(1) DEFAULT '0',
  `avg15MinuteKw` double DEFAULT NULL,
  `selectedTest` int(11) DEFAULT NULL,
  `servicePlan` int(11) DEFAULT NULL,
  `lastBudget` longtext,
  `lastBudgetInvoice` longtext,
  `lastRecordedTime` bigint(20) DEFAULT NULL,
  `kwhRate` double DEFAULT '0',
  `kwRate` double DEFAULT '0',
  `lastKwh` double DEFAULT '0',
  `taxRate` double DEFAULT '0',
  `totalAmpLoad` double DEFAULT '0',
  `lastTotalPf` double DEFAULT '100',
  `initialPf` double DEFAULT '100',
  `currencyExchangeCharge` double DEFAULT '0',
  `currencyExchangeRate` double DEFAULT '1',
  `subNeeded` tinyint(1) DEFAULT '0',
  `subStartDate` varchar(255) DEFAULT '',
  `multiplier` double DEFAULT '1',
  `peakMultiplier` double DEFAULT '1',
  `ILRatio` double DEFAULT '100',
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `servicePlan` (`servicePlan`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=535 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_project
BEFORE INSERT ON `project_old` FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_project
AFTER DELETE ON `project_old` FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("project", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `project_users__user_projects`
--

DROP TABLE IF EXISTS `project_users__user_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_users__user_projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_users` int(11) DEFAULT NULL,
  `user_projects` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=3616 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_project_users__user_projects
BEFORE INSERT ON project_users__user_projects
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_project_users__user_projects
BEFORE INSERT ON project_users__user_projects
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_project_users__user_projects
AFTER DELETE ON project_users__user_projects
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("project_users__user_projects", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `provisionings`
--

DROP TABLE IF EXISTS `provisionings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `provisionings` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `DEPLOYMENTID` int(11) NOT NULL,
  `switchID` int(11) DEFAULT NULL,
  `meterID` int(11) DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `ENdDate` datetime(6) DEFAULT NULL,
  `routerPort` int(11) DEFAULT NULL,
  `active` int(11) DEFAULT NULL,
  `routerIP` varchar(255) DEFAULT NULL,
  `IsDeleted` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `repeater`
--

DROP TABLE IF EXISTS `repeater`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repeater` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `lastCommunicatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `gateway` varchar(255) DEFAULT NULL,
  `meshIp` varchar(255) DEFAULT NULL,
  `meshLastCommunicatedAt` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=22829 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_repeater
BEFORE INSERT ON repeater
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_repeater
AFTER DELETE ON repeater
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("repeater", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `repeateralert`
--

DROP TABLE IF EXISTS `repeateralert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repeateralert` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `triggerNotificationOn` double DEFAULT NULL,
  `lastNotificationsSent` double DEFAULT NULL,
  `repeater` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_repeateralert
BEFORE INSERT ON repeateralert
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_repeateralert
AFTER DELETE ON repeateralert
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("repeateralert", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `repeateralertevent`
--

DROP TABLE IF EXISTS `repeateralertevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repeateralertevent` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `repeater` int(11) DEFAULT NULL,
  `alertGroup` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_repeateralertevent
BEFORE INSERT ON repeateralertevent
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_repeateralertevent
AFTER DELETE ON repeateralertevent
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("repeateralertevent", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `repeateralertgroup`
--

DROP TABLE IF EXISTS `repeateralertgroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repeateralertgroup` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `alertType` double DEFAULT NULL,
  `threshold` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `note` varchar(255) DEFAULT 'false',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_repeateralertgroup
BEFORE INSERT ON repeateralertgroup
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_repeateralertgroup
AFTER DELETE ON repeateralertgroup
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("repeateralertgroup", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `repeateralertgroup_users__user_repeaterAlertGroups`
--

DROP TABLE IF EXISTS `repeateralertgroup_users__user_repeaterAlertGroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repeateralertgroup_users__user_repeaterAlertGroups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repeateralertgroup_users` int(11) DEFAULT NULL,
  `user_repeaterAlertGroups` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_repeateralertgroup_users__user_repeaterAlertGroups
BEFORE INSERT ON repeateralertgroup_users__user_repeaterAlertGroups
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_repeateralertgroup_users__user_repeaterAlertGroups
BEFORE INSERT ON repeateralertgroup_users__user_repeaterAlertGroups
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_repeateralertgroup_users__user_repeaterAlertGroups
AFTER DELETE ON repeateralertgroup_users__user_repeaterAlertGroups
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("repeateralertgroup_users__user_repeaterAlertGroups", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `reportdata`
--

DROP TABLE IF EXISTS `reportdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reportdata` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) NOT NULL,
  `typeId` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `valueType` varchar(255) DEFAULT NULL,
  `period` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `value` double DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `xuid` (`xuid`)
) ENGINE=InnoDB AUTO_INCREMENT=20688 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `savingsreport`
--

DROP TABLE IF EXISTS `savingsreport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `savingsreport` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `month` varchar(255) DEFAULT NULL,
  `fromDate` double DEFAULT NULL,
  `toDate` double DEFAULT NULL,
  `reportData` longtext,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=4546 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_savingsreport
BEFORE INSERT ON savingsreport
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_savingsreport
AFTER DELETE ON savingsreport
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("savingsreport", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `schedule`
--

DROP TABLE IF EXISTS `schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schedule` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `startDate` varchar(255) DEFAULT NULL,
  `endDate` varchar(255) DEFAULT NULL,
  `scheduleDetail` longtext,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `switches` longtext,
  `isCompleted` tinyint(1) DEFAULT NULL,
  `daysOfWeek` text,
  `totalHoursOff` double DEFAULT NULL,
  `deviceType` tinyint(1) DEFAULT '2',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_schedule
BEFORE INSERT ON schedule
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_schedule
AFTER DELETE ON schedule
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("schedule", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `serviceplan`
--

DROP TABLE IF EXISTS `serviceplan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `serviceplan` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `type` varchar(10) NOT NULL,
  `price` double NOT NULL,
  `subscription` int(11) NOT NULL,
  `billingInterval` tinyint(2) NOT NULL,
  `paymentMethod` varchar(10) NOT NULL,
  `accountNumber` varchar(10) NOT NULL,
  `expiresAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_serviceplan
BEFORE INSERT ON serviceplan
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_serviceplan
AFTER DELETE ON serviceplan
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("serviceplan", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `switch`
--

DROP TABLE IF EXISTS `switch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switch` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `deviceType` double DEFAULT NULL,
  `lastCommunicatedAt` double DEFAULT NULL,
  `meshLastCommunicatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `hasSchedule` tinyint(1) DEFAULT '0',
  `ampLoad` double DEFAULT NULL,
  `voltage` double DEFAULT NULL,
  `pf` double DEFAULT NULL,
  `originalHours` double DEFAULT NULL,
  `gateway` varchar(255) DEFAULT NULL,
  `meshIp` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=452972 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_switch
BEFORE INSERT ON switch
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger _switch_history_insert
AFTER INSERT ON switch
FOR EACH ROW
  INSERT INTO _device_history (operation, device, id, xuid, name, meshId, deviceId, project, time) VALUES ('Insert', 'switch', NEW.id, NEW.xuid, NEW.name, NEW.meshId, NEW.deviceId, NEW.project, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_switch
AFTER DELETE ON switch
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("switch", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger _switch_history_delete
AFTER DELETE ON switch
FOR EACH ROW
  INSERT INTO _device_history (operation, device, id, xuid, name, meshId, deviceId, project, time) VALUES ('Delete', 'switch', OLD.id, OLD.xuid, OLD.name, OLD.meshId, OLD.deviceId, OLD.project, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `switch_switches_switch__switchcommand_switches`
--

DROP TABLE IF EXISTS `switch_switches_switch__switchcommand_switches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switch_switches_switch__switchcommand_switches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `switchcommand_switches` int(11) DEFAULT NULL,
  `switch_switches_switch` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=120843 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_switch_switches_switch__switchcommand_switches
BEFORE INSERT ON switch_switches_switch__switchcommand_switches
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_switch_switches_switch__switchcommand_switches
BEFORE INSERT ON switch_switches_switch__switchcommand_switches
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_switch_switches_switch__switchcommand_switches
AFTER DELETE ON switch_switches_switch__switchcommand_switches
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("switch_switches_switch__switchcommand_switches", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `switchalert`
--

DROP TABLE IF EXISTS `switchalert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switchalert` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `triggerNotificationOn` double DEFAULT NULL,
  `lastNotificationsSent` double DEFAULT NULL,
  `switch` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_switchalert
BEFORE INSERT ON switchalert
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_switchalert
AFTER DELETE ON switchalert
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("switchalert", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `switchalertevent`
--

DROP TABLE IF EXISTS `switchalertevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switchalertevent` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `switch` int(11) DEFAULT NULL,
  `alertGroup` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=285 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_switchalertevent
BEFORE INSERT ON switchalertevent
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_switchalertevent
AFTER DELETE ON switchalertevent
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("switchalertevent", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `switchalertgroup`
--

DROP TABLE IF EXISTS `switchalertgroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switchalertgroup` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `alertType` double DEFAULT NULL,
  `threshold` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `note` varchar(255) DEFAULT 'false',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_switchalertgroup
BEFORE INSERT ON switchalertgroup
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_switchalertgroup
AFTER DELETE ON switchalertgroup
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("switchalertgroup", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `switchalertgroup_users__user_switchAlertGroups`
--

DROP TABLE IF EXISTS `switchalertgroup_users__user_switchAlertGroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switchalertgroup_users__user_switchAlertGroups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `switchalertgroup_users` int(11) DEFAULT NULL,
  `user_switchAlertGroups` int(11) DEFAULT NULL,
  `xuid` varchar(36) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_switchalertgroup_users__user_switchAlertGroups
BEFORE INSERT ON switchalertgroup_users__user_switchAlertGroups
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger updatedAt_switchalertgroup_users__user_switchAlertGroups
BEFORE INSERT ON switchalertgroup_users__user_switchAlertGroups
FOR EACH ROW
  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_switchalertgroup_users__user_switchAlertGroups
AFTER DELETE ON switchalertgroup_users__user_switchAlertGroups
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("switchalertgroup_users__user_switchAlertGroups", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `switchcommand`
--

DROP TABLE IF EXISTS `switchcommand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switchcommand` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `commandType` double DEFAULT NULL,
  `startAt` double DEFAULT NULL,
  `acceptedBySwitchIds` longtext,
  `isCancelled` tinyint(1) DEFAULT NULL,
  `cancelledBySwitchIds` longtext,
  `project` int(11) DEFAULT NULL,
  `test` int(11) DEFAULT NULL,
  `executedBySwitchIds` text,
  `deviceType` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=61155 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_switchcommand
BEFORE INSERT ON switchcommand
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_switchcommand
AFTER DELETE ON switchcommand
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("switchcommand", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `test`
--

DROP TABLE IF EXISTS `test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `startAt` double DEFAULT NULL,
  `endAt` double DEFAULT NULL,
  `duration` double DEFAULT NULL,
  `interval` double DEFAULT NULL,
  `hiddenMeterDataRowIds` longtext,
  `reportData` longtext,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `allswitchesset` longtext,
  `isStatic` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`)
) ENGINE=InnoDB AUTO_INCREMENT=7958282 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `certificateNo` varchar(255) DEFAULT NULL,
  `hashedPassword` varchar(255) DEFAULT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `role` double DEFAULT NULL,
  `lastActiveAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `client` int(11) DEFAULT NULL,
  `defaultProject` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=153336 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_user
BEFORE INSERT ON user
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_user
AFTER DELETE ON user
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("user", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;

--
-- Table structure for table `xeco`
--

DROP TABLE IF EXISTS `xeco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `xeco` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `xuid` varchar(36) DEFAULT NULL,
  `billingEmail` varchar(255) DEFAULT NULL,
  `billingPhone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `carbonCreditRate` double DEFAULT NULL,
  `xecoManagerCostPercent` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `billingEmail` (`billingEmail`),
  UNIQUE KEY `xuid` (`xuid`),
  KEY `updatedAt` (`updatedAt`)
) ENGINE=InnoDB AUTO_INCREMENT=759875 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger xuid_xeco
BEFORE INSERT ON xeco
FOR EACH ROW
  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
ALTER DATABASE `xeco` CHARACTER SET latin1 COLLATE latin1_swedish_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger deleteXuid_xeco
AFTER DELETE ON xeco
FOR EACH ROW
    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) 
        VALUES ("xeco", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))
    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `xeco` CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-16 20:58:13
