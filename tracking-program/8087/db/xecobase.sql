-- MySQL dump 10.13  Distrib 5.6.20, for osx10.8 (x86_64)
--
-- Host: 127.0.0.1    Database: xeco
-- ------------------------------------------------------
-- Server version	5.7.18

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
-- Current Database: `xeco`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `xeco` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `xeco`;

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
  `paymentTerms` varchar(255) DEFAULT NULL,
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client`
--

LOCK TABLES `client` WRITE;
/*!40000 ALTER TABLE `client` DISABLE KEYS */;
INSERT INTO `client` VALUES (1496956233736,1496956233736,1,'Xeco Energy Corporation','','352 South 200 West','Farmington','UT','84025','US','Buck Rogers','','','','','',0,'','','','','','','','',0);
/*!40000 ALTER TABLE `client` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meter`
--

LOCK TABLES `meter` WRITE;
/*!40000 ALTER TABLE `meter` DISABLE KEYS */;
/*!40000 ALTER TABLE `meter` ENABLE KEYS */;
UNLOCK TABLES;


DROP TABLE IF EXISTS `reportdata`;
CREATE TABLE `reportdata` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `typeId` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `valueType` varchar(255) DEFAULT NULL,
  `period` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `value` double DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `reportdata` WRITE;
/*!40000 ALTER TABLE `meter` DISABLE KEYS */;
/*!40000 ALTER TABLE `meter` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meter_meters_meter__metercsv_meters`
--

LOCK TABLES `meter_meters_meter__metercsv_meters` WRITE;
/*!40000 ALTER TABLE `meter_meters_meter__metercsv_meters` DISABLE KEYS */;
/*!40000 ALTER TABLE `meter_meters_meter__metercsv_meters` ENABLE KEYS */;
UNLOCK TABLES;

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
  `triggerNotificationOn` double DEFAULT NULL,
  `lastNotificationsSent` double DEFAULT NULL,
  `meter` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meteralert`
--

LOCK TABLES `meteralert` WRITE;
/*!40000 ALTER TABLE `meteralert` DISABLE KEYS */;
/*!40000 ALTER TABLE `meteralert` ENABLE KEYS */;
UNLOCK TABLES;

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
  `meter` int(11) DEFAULT NULL,
  `alertGroup` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meteralertevent`
--

LOCK TABLES `meteralertevent` WRITE;
/*!40000 ALTER TABLE `meteralertevent` DISABLE KEYS */;
/*!40000 ALTER TABLE `meteralertevent` ENABLE KEYS */;
UNLOCK TABLES;

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
  `alertType` double DEFAULT NULL,
  `threshold` double DEFAULT NULL,
  `delay` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meteralertgroup`
--

LOCK TABLES `meteralertgroup` WRITE;
/*!40000 ALTER TABLE `meteralertgroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `meteralertgroup` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meteralertgroup_users__user_meterAlertGroups`
--

LOCK TABLES `meteralertgroup_users__user_meterAlertGroups` WRITE;
/*!40000 ALTER TABLE `meteralertgroup_users__user_meterAlertGroups` DISABLE KEYS */;
/*!40000 ALTER TABLE `meteralertgroup_users__user_meterAlertGroups` ENABLE KEYS */;
UNLOCK TABLES;

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
  `reportType` double DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  `fromDate` double DEFAULT NULL,
  `toDate` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metercsv`
--

LOCK TABLES `metercsv` WRITE;
/*!40000 ALTER TABLE `metercsv` DISABLE KEYS */;
/*!40000 ALTER TABLE `metercsv` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metercsv_users__user_users_user`
--

LOCK TABLES `metercsv_users__user_users_user` WRITE;
/*!40000 ALTER TABLE `metercsv_users__user_users_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `metercsv_users__user_users_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meterdata`
--

DROP TABLE IF EXISTS `meterdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meterdata` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
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
--  KEY `meter_idx` (`meter`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meterdata`
--

LOCK TABLES `meterdata` WRITE;
/*!40000 ALTER TABLE `meterdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `meterdata` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `projday_idx` (`project`,`day`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meterdataaggregate`
--

LOCK TABLES `meterdataaggregate` WRITE;
/*!40000 ALTER TABLE `meterdataaggregate` DISABLE KEYS */;
/*!40000 ALTER TABLE `meterdataaggregate` ENABLE KEYS */;
UNLOCK TABLES;


DROP TABLE IF EXISTS `permeterdataaggregate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permeterdataaggregate` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `day` varchar(255) DEFAULT NULL,
  `intervalId` varchar(255) DEFAULT NULL,
  `numSamples` double DEFAULT NULL,
  `intervalStartTime` double DEFAULT NULL,
  `intervalEndTime` double DEFAULT NULL,
  `meter` int(11) DEFAULT NULL ,
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meterdataaggregate`
--

LOCK TABLES `permeterdataaggregate` WRITE;
/*!40000 ALTER TABLE `meterdataaggregate` DISABLE KEYS */;
/*!40000 ALTER TABLE `meterdataaggregate` ENABLE KEYS */;
UNLOCK TABLES;

CREATE TABLE `schedule` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `startDate` double DEFAULT NULL,
  `endDate` double DEFAULT NULL,
  `scheduleDetail` longtext,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `switches` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `schedule` WRITE;
/*!40000 ALTER TABLE `meterdataaggregate` DISABLE KEYS */;
/*!40000 ALTER TABLE `meterdataaggregate` ENABLE KEYS */;
UNLOCK TABLES;

CREATE TABLE `file` (
  `createdAt` bigint(20) DEFAULT NULL,
  `updatedAt` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `file` WRITE;
/*!40000 ALTER TABLE `meterdataaggregate` DISABLE KEYS */;
/*!40000 ALTER TABLE `meterdataaggregate` ENABLE KEYS */;
UNLOCK TABLES;
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
  `name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `proposalNumber` varchar(255) DEFAULT NULL,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  `workOrder` varchar(255) DEFAULT NULL,
  `purchaseOrder` varchar(255) DEFAULT NULL,
  `depositAmount` double DEFAULT NULL,
  `discount` double DEFAULT NULL,
  `totalCost` double DEFAULT NULL,
  `currencyType` varchar(255) DEFAULT NULL,
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
  `totalKva` double DEFAULT NULL,
  `avg15MinuteKva` double DEFAULT NULL,
  `peakKva` double DEFAULT NULL,
  `avg15MinuteKw` double DEFAULT NULL,
  `peakKw` double DEFAULT NULL,
  `avgL1Amp` double DEFAULT NULL,
  `avgL2Amp` double DEFAULT NULL,
  `avgL3Amp` double DEFAULT NULL,
  `avgL1Pf` double DEFAULT NULL,
  `avgL2Pf` double DEFAULT NULL,
  `avgL3Pf` double DEFAULT NULL,
  `totalL1Kvar` double DEFAULT NULL,
  `totalL2Kvar` double DEFAULT NULL,
  `totalL3Kvar` double DEFAULT NULL,
  `avgL1Volt` double DEFAULT NULL,
  `avgL2Volt` double DEFAULT NULL,
  `avgL3Volt` double DEFAULT NULL,
  `electricBillAnalysis` longtext,
  `equipmentInfo` longtext,
  `client` int(11) DEFAULT NULL,
  `xecoManager` int(11) DEFAULT NULL,
  `selectedTest` int(11) DEFAULT NULL,
  `servicePlan` int(11) DEFAULT NULL,
  `lastBudgetInvoice` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
  UNIQUE KEY `servicePlan` (`servicePlan`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project`
--

LOCK TABLES `project` WRITE;
/*!40000 ALTER TABLE `project` DISABLE KEYS */;
/*!40000 ALTER TABLE `project` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_users__user_projects`
--

LOCK TABLES `project_users__user_projects` WRITE;
/*!40000 ALTER TABLE `project_users__user_projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_users__user_projects` ENABLE KEYS */;
UNLOCK TABLES;

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
  `name` varchar(255) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `lastCommunicatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repeater`
--

LOCK TABLES `repeater` WRITE;
/*!40000 ALTER TABLE `repeater` DISABLE KEYS */;
/*!40000 ALTER TABLE `repeater` ENABLE KEYS */;
UNLOCK TABLES;

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
  `triggerNotificationOn` double DEFAULT NULL,
  `lastNotificationsSent` double DEFAULT NULL,
  `repeater` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repeateralert`
--

LOCK TABLES `repeateralert` WRITE;
/*!40000 ALTER TABLE `repeateralert` DISABLE KEYS */;
/*!40000 ALTER TABLE `repeateralert` ENABLE KEYS */;
UNLOCK TABLES;

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
  `repeater` int(11) DEFAULT NULL,
  `alertGroup` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repeateralertevent`
--

LOCK TABLES `repeateralertevent` WRITE;
/*!40000 ALTER TABLE `repeateralertevent` DISABLE KEYS */;
/*!40000 ALTER TABLE `repeateralertevent` ENABLE KEYS */;
UNLOCK TABLES;

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
  `alertType` double DEFAULT NULL,
  `threshold` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repeateralertgroup`
--

LOCK TABLES `repeateralertgroup` WRITE;
/*!40000 ALTER TABLE `repeateralertgroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `repeateralertgroup` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repeateralertgroup_users__user_repeaterAlertGroups`
--

LOCK TABLES `repeateralertgroup_users__user_repeaterAlertGroups` WRITE;
/*!40000 ALTER TABLE `repeateralertgroup_users__user_repeaterAlertGroups` DISABLE KEYS */;
/*!40000 ALTER TABLE `repeateralertgroup_users__user_repeaterAlertGroups` ENABLE KEYS */;
UNLOCK TABLES;

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
  `month` varchar(255) DEFAULT NULL,
  `fromDate` double DEFAULT NULL,
  `toDate` double DEFAULT NULL,
  `reportData` longtext,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savingsreport`
--

LOCK TABLES `savingsreport` WRITE;
/*!40000 ALTER TABLE `savingsreport` DISABLE KEYS */;
/*!40000 ALTER TABLE `savingsreport` ENABLE KEYS */;
UNLOCK TABLES;

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
  `name` varchar(255) DEFAULT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `meshId` varchar(255) DEFAULT NULL,
  `deviceType` double DEFAULT NULL,
  `lastCommunicatedAt` double DEFAULT NULL,
  `meshLastCommunicatedAt` double DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  `hasSchedule` tinyint(1) DEFAULT NULL,
  `gateway` varchar(255) DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `switch`
--

LOCK TABLES `switch` WRITE;
/*!40000 ALTER TABLE `switch` DISABLE KEYS */;
/*!40000 ALTER TABLE `switch` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `switch_switches_switch__switchcommand_switches`
--

LOCK TABLES `switch_switches_switch__switchcommand_switches` WRITE;
/*!40000 ALTER TABLE `switch_switches_switch__switchcommand_switches` DISABLE KEYS */;
/*!40000 ALTER TABLE `switch_switches_switch__switchcommand_switches` ENABLE KEYS */;
UNLOCK TABLES;

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
  `triggerNotificationOn` double DEFAULT NULL,
  `lastNotificationsSent` double DEFAULT NULL,
  `switch` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `switchalert`
--

LOCK TABLES `switchalert` WRITE;
/*!40000 ALTER TABLE `switchalert` DISABLE KEYS */;
/*!40000 ALTER TABLE `switchalert` ENABLE KEYS */;
UNLOCK TABLES;

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
  `switch` int(11) DEFAULT NULL,
  `alertGroup` int(11) DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `switchalertevent`
--

LOCK TABLES `switchalertevent` WRITE;
/*!40000 ALTER TABLE `switchalertevent` DISABLE KEYS */;
/*!40000 ALTER TABLE `switchalertevent` ENABLE KEYS */;
UNLOCK TABLES;

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
  `alertType` double DEFAULT NULL,
  `threshold` double DEFAULT NULL,
  `project` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `switchalertgroup`
--

LOCK TABLES `switchalertgroup` WRITE;
/*!40000 ALTER TABLE `switchalertgroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `switchalertgroup` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `switchalertgroup_users__user_switchAlertGroups`
--

LOCK TABLES `switchalertgroup_users__user_switchAlertGroups` WRITE;
/*!40000 ALTER TABLE `switchalertgroup_users__user_switchAlertGroups` DISABLE KEYS */;
/*!40000 ALTER TABLE `switchalertgroup_users__user_switchAlertGroups` ENABLE KEYS */;
UNLOCK TABLES;

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
  `commandType` double DEFAULT NULL,
  `startAt` double DEFAULT NULL,
  `duration` double DEFAULT NULL,
  `interval` double DEFAULT NULL,
  `acceptedBySwitchIds` longtext,
  `isCancelled` tinyint(1) DEFAULT NULL,
  `cancelledBySwitchIds` longtext,
  `project` int(11) DEFAULT NULL,
  `test` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `switchcommand`
--

LOCK TABLES `switchcommand` WRITE;
/*!40000 ALTER TABLE `switchcommand` DISABLE KEYS */;
/*!40000 ALTER TABLE `switchcommand` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `xuid` (`xuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test`
--

LOCK TABLES `test` WRITE;
/*!40000 ALTER TABLE `test` DISABLE KEYS */;
/*!40000 ALTER TABLE `test` ENABLE KEYS */;
UNLOCK TABLES;

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
  `type` varchar(10) NOT NULL,
  `price` double NOT NULL,
  `subscription` int(11) NOT NULL,
  `billingInterval` tinyint(2) NOT NULL,
  `paymentMethod` varchar(10) NOT NULL,
  `accountNumber` varchar(10) NOT NULL,
  `expiresAt` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serviceplan`
--

LOCK TABLES `serviceplan` WRITE;
/*!40000 ALTER TABLE `serviceplan` DISABLE KEYS */;
/*!40000 ALTER TABLE `serviceplan` ENABLE KEYS */;
UNLOCK TABLES;

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
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1496956233763,1496956233763,1,'Greg','Dockery','greg.dockery@xecoenergy.com','','','$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC','f4k3t0k3n--1',8,0,0,1,NULL),(1496956233763,1496956233763,2,'Landon','Dockery','landon.dockery@xecoenergy.com','','','$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC','f4k3t0k3n--2',8,0,0,1,NULL),(1496956233763,1496956233763,3,'Enola','Labs','marcus.turner@enolalabs.com','','','$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC','f4k3t0k3n--3',8,0,0,1,NULL),(1496956233763,1496956233763,4,'Sails','Company','sailsco@enolalabs.com','','','$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC','f4k3t0k3n--3',8,0,0,1,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

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
  UNIQUE KEY `billingEmail` (`billingEmail`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `xeco`
--

LOCK TABLES `xeco` WRITE;
/*!40000 ALTER TABLE `xeco` DISABLE KEYS */;
INSERT INTO `xeco` VALUES (1496956233719,1496956233719,1,'billing@xecoenergy.com','+1 (555) 555.5555','352 South 200 West\nSuite 123  #987\nATTN: Arlene Agoncillo','Farmington','UT','84025',11,5);
/*!40000 ALTER TABLE `xeco` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-06-08 16:10:34
