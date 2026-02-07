IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$(DB_NAME)')
BEGIN
    CREATE DATABASE [$(DB_NAME)];
END
GO

USE [$(DB_NAME)];
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[clients]') AND type = N'U')
BEGIN
    CREATE TABLE [dbo].[clients] (
        Id               INT IDENTITY(1,1) PRIMARY KEY,
        NombreCompleto   NVARCHAR(100) NOT NULL,
        DNI              BIGINT        NOT NULL,
        Estado           VARCHAR(10)   NOT NULL,
        FechaIngreso     DATE          NOT NULL,
        EsPEP            BIT           NOT NULL,
        EsSujetoObligado BIT           NULL,
        FechaCreacion    DATETIME      NOT NULL
    );
END
GO
