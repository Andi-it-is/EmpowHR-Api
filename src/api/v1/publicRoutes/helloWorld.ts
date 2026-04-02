import { RequestHandler } from "express";

/**
 * @swagger
 * /hello:
 *   get:
 *     summary: Hello World Test Route
 *     description: Öffentliche Testroute zur API-Validierung
 *     tags:
 *       - Test
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Hello World from the Public Test Route.
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Kein Zugriff
 *       500:
 *         description: Serverfehler
 */
export const getHelloWorld: RequestHandler = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Hello World from the Public Test Route."
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @swagger
 * /hello:
 *   post:
 *     summary: Hello World POST Route
 *     description: Testroute mit Request Body
 *     tags:
 *       - Test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: Max Mustermann
 *               message:
 *                 type: string
 *                 example: Hallo von der POST Route
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Max Mustermann
 *                     message:
 *                       type: string
 *                       example: Hallo von der POST Route
 *       400:
 *         description: Fehlende oder ungültige Body-Felder
 *       500:
 *         description: Serverfehler
 */
export const postHelloWorld: RequestHandler = async (req, res, next) => {
  try {
    const { name, message } = req.body

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: "name und message sind Pflichtfelder."
      })
    }

    return res.status(200).json({
      success: true,
      data: { name, message }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @swagger
 * /hello/{id}:
 *   patch:
 *     summary: Hello World PATCH Route
 *     description: Testroute mit URL-Parameter und Body
 *     tags:
 *       - Test
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des zu aktualisierenden Eintrags
 *         example: abc-123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Max Mustermann
 *               message:
 *                 type: string
 *                 example: Aktualisierte Nachricht
 *     responses:
 *       200:
 *         description: Erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: abc-123
 *                     name:
 *                       type: string
 *                       example: Max Mustermann
 *                     message:
 *                       type: string
 *                       example: Aktualisierte Nachricht
 *       400:
 *         description: Fehlende oder ungültige Felder
 *       404:
 *         description: Eintrag nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const patchHelloWorld: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, message } = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID ist ein Pflichtfeld."
      })
    }

    if (!name && !message) {
      return res.status(400).json({
        success: false,
        message: "Mindestens ein Feld (name oder message) muss angegeben werden."
      })
    }

    return res.status(200).json({
      success: true,
      data: { id, name, message }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @swagger
 * /hello:
 *   put:
 *     summary: Hello World PUT Route
 *     description: Testroute mit Query Parametern
 *     tags:
 *       - Test
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: Max Mustermann
 *       - in: query
 *         name: message
 *         required: false
 *         schema:
 *           type: string
 *         example: Hallo von der PUT Route
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Max Mustermann
 *                     message:
 *                       type: string
 *                       example: Hallo von der PUT Route
 *       400:
 *         description: Fehlende Query Parameter
 *       500:
 *         description: Serverfehler
 */
export const putHelloWorld: RequestHandler = async (req, res, next) => {
  try {
    const { name, message } = req.query

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Query Parameter 'name' ist ein Pflichtfeld."
      })
    }

    return res.status(200).json({
      success: true,
      data: { name, message: message ?? null }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @swagger
 * /hello/{id}:
 *   delete:
 *     summary: Hello World DELETE Route
 *     description: Testroute mit URL-Parameter zum Löschen
 *     tags:
 *       - Test
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des zu löschenden Eintrags
 *         example: abc-123
 *     responses:
 *       200:
 *         description: Erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Eintrag abc-123 wurde gelöscht.
 *       400:
 *         description: Fehlende ID
 *       404:
 *         description: Eintrag nicht gefunden
 *       500:
 *         description: Serverfehler
 */
export const deleteHelloWorld: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID ist ein Pflichtfeld."
      })
    }

    return res.status(200).json({
      success: true,
      message: `Eintrag ${id} wurde gelöscht.`
    })
  } catch (error) {
    next(error)
  }
}