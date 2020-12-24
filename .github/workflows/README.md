# Docable-Notebooks Builds

There are two GitHub workflows for building a [`stable`](./trigger_installer_build.yml) and [`preview`](./trigger_preview_installer_build.yml) version of docable-tray. `stable` build is triggered when a new release created, and `preview` build is triggered for each commit pushed to master.

```
     Preview Build            Stable Build

 +------------------+      +------------------+
 | docable-notebook |      | docable-notebook |
 | master commit    |      | release created  |
 | pushed           |      |                  |
 +--------+---------+      +---------+--------+
          |                          |
          |                          |
+---------v--------+       +---------v--------+
| trigger          |       | trigger          |
| docable-notebook |       | docable-notebook |
| action           |       | action           |
+---------+--------+       +---------+--------+
          |                          |
          |                          |
+---------v---------+      +---------v--------+
| trigger           |      | trigger          |
| docable.app build |      | docable.app build|
| (makes installer  |      | (makes installer |
| & uploads assets) |      | & uploads assets)|
+-------------------+      +------------------+

```
