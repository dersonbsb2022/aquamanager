-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WaterType" AS ENUM ('FRESHWATER', 'SALTWATER', 'BRACKISH');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('ALIVE', 'DEAD', 'DONATED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('FILTER', 'HEATER', 'LIGHT', 'CO2', 'PUMP', 'SKIMMER', 'UV_STERILIZER', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aquariums" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volume_liters" DOUBLE PRECISION NOT NULL,
    "water_type" "WaterType" NOT NULL DEFAULT 'FRESHWATER',
    "target_temp_min" DOUBLE PRECISION,
    "target_temp_max" DOUBLE PRECISION,
    "substrate" TEXT,
    "start_date" TIMESTAMP(3),
    "notes" TEXT,
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aquariums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" TEXT NOT NULL,
    "aquarium_id" TEXT NOT NULL,
    "species_name" TEXT NOT NULL,
    "common_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "AnimalStatus" NOT NULL DEFAULT 'ALIVE',
    "added_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_parameters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameter_ranges" (
    "id" TEXT NOT NULL,
    "test_parameter_id" TEXT NOT NULL,
    "water_type" "WaterType" NOT NULL,
    "ideal_min" DOUBLE PRECISION,
    "ideal_max" DOUBLE PRECISION,

    CONSTRAINT "parameter_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_tests" (
    "id" TEXT NOT NULL,
    "aquarium_id" TEXT NOT NULL,
    "tested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_test_results" (
    "id" TEXT NOT NULL,
    "water_test_id" TEXT NOT NULL,
    "test_parameter_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "is_within_range" BOOLEAN,

    CONSTRAINT "water_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_changes" (
    "id" TEXT NOT NULL,
    "aquarium_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "volume_liters" DOUBLE PRECISION NOT NULL,
    "percent_volume" DOUBLE PRECISION,
    "used_dechlorinator" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipments" (
    "id" TEXT NOT NULL,
    "aquarium_id" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "installed_at" TIMESTAMP(3),
    "last_maintenance_at" TIMESTAMP(3),
    "next_maintenance_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosings" (
    "id" TEXT NOT NULL,
    "aquarium_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "amount_ml" DOUBLE PRECISION NOT NULL,
    "dosed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dosings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "test_parameters_name_key" ON "test_parameters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_ranges_test_parameter_id_water_type_key" ON "parameter_ranges"("test_parameter_id", "water_type");

-- CreateIndex
CREATE UNIQUE INDEX "water_test_results_water_test_id_test_parameter_id_key" ON "water_test_results"("water_test_id", "test_parameter_id");

-- AddForeignKey
ALTER TABLE "aquariums" ADD CONSTRAINT "aquariums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parameter_ranges" ADD CONSTRAINT "parameter_ranges_test_parameter_id_fkey" FOREIGN KEY ("test_parameter_id") REFERENCES "test_parameters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_tests" ADD CONSTRAINT "water_tests_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_test_results" ADD CONSTRAINT "water_test_results_water_test_id_fkey" FOREIGN KEY ("water_test_id") REFERENCES "water_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_test_results" ADD CONSTRAINT "water_test_results_test_parameter_id_fkey" FOREIGN KEY ("test_parameter_id") REFERENCES "test_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_changes" ADD CONSTRAINT "water_changes_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosings" ADD CONSTRAINT "dosings_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

