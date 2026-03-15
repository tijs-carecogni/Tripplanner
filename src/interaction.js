export function slugifyEntityToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildEntityLinkKey(itemOrTitle, cityValue = "") {
  if (itemOrTitle && typeof itemOrTitle === "object") {
    const title = itemOrTitle.title || itemOrTitle.locationLabel || itemOrTitle.venue || "";
    const city = itemOrTitle.city || cityValue || "";
    const titleSlug = slugifyEntityToken(title);
    const citySlug = slugifyEntityToken(city);
    if (!titleSlug && !citySlug) return "";
    return `link:${titleSlug}${citySlug ? `@${citySlug}` : ""}`;
  }

  const titleSlug = slugifyEntityToken(itemOrTitle);
  const citySlug = slugifyEntityToken(cityValue);
  if (!titleSlug && !citySlug) return "";
  return `link:${titleSlug}${citySlug ? `@${citySlug}` : ""}`;
}

function getInteractiveTarget(element, selector) {
  if (!element || typeof element.closest !== "function") return null;
  return element.closest(selector);
}

export function createHighlightController() {
  const interactiveSelector = "[data-entity-key], [data-segment-key], [data-entity-link]";
  let mapHighlightEntries = [];
  let highlightedEntityKey = "";
  let highlightedSegmentKey = "";
  let highlightedEntityLinkKey = "";
  let pinnedHighlight = null;
  let pinningEnabled = true;
  let boundRoot = null;

  const onPointerOver = (event) => {
    if (pinnedHighlight) return;
    const target = getInteractiveTarget(event.target, interactiveSelector);
    if (!target) return;
    setHighlightedEntity(
      target.dataset.entityKey || "",
      target.dataset.segmentKey || "",
      target.dataset.entityLink || "",
      { source: "hover" }
    );
  };

  const onPointerOut = (event) => {
    if (pinnedHighlight) return;
    const current = getInteractiveTarget(event.target, interactiveSelector);
    if (!current) return;
    const related = event.relatedTarget;
    const next = getInteractiveTarget(related, interactiveSelector);

    const nextEntity = next?.dataset.entityKey || "";
    const nextSegment = next?.dataset.segmentKey || "";
    const nextLink = next?.dataset.entityLink || "";
    const currentEntity = current.dataset.entityKey || "";
    const currentSegment = current.dataset.segmentKey || "";
    const currentLink = current.dataset.entityLink || "";
    if (currentEntity === nextEntity && currentSegment === nextSegment && currentLink === nextLink) return;
    setHighlightedEntity(nextEntity, nextSegment, nextLink, { source: "hover" });
  };

  const onClick = (event) => {
    if (!pinningEnabled) return;
    const actionButton = event.target?.closest?.("button[data-action]");
    if (actionButton) return;

    const target = getInteractiveTarget(event.target, interactiveSelector);
    if (!target) {
      if (pinnedHighlight) {
        clearPinned();
      }
      return;
    }

    const nextEntity = String(target.dataset.entityKey || "");
    const nextSegment = String(target.dataset.segmentKey || "");
    const nextLink = String(target.dataset.entityLink || "");
    const isSameAsPinned = Boolean(
      pinnedHighlight
      && pinnedHighlight.entityKey === nextEntity
      && pinnedHighlight.segmentKey === nextSegment
      && pinnedHighlight.linkKey === nextLink
    );
    if (isSameAsPinned) {
      clearPinned();
      return;
    }

    pinnedHighlight = { entityKey: nextEntity, segmentKey: nextSegment, linkKey: nextLink };
    setHighlightedEntity(nextEntity, nextSegment, nextLink, { source: "pin" });
  };

  const onKeyDown = (event) => {
    if (!pinningEnabled) return;
    if (event.key !== "Escape") return;
    if (!pinnedHighlight) return;
    clearPinned();
  };

  function bindRoot(root = document.body) {
    if (!root || typeof root.addEventListener !== "function") return;
    if (boundRoot === root) return;
    if (boundRoot) {
      boundRoot.removeEventListener("pointerover", onPointerOver);
      boundRoot.removeEventListener("pointerout", onPointerOut);
      boundRoot.removeEventListener("click", onClick);
      boundRoot.removeEventListener("keydown", onKeyDown);
    }
    boundRoot = root;
    boundRoot.addEventListener("pointerover", onPointerOver);
    boundRoot.addEventListener("pointerout", onPointerOut);
    boundRoot.addEventListener("click", onClick);
    boundRoot.addEventListener("keydown", onKeyDown);
  }

  function setHighlightedEntity(entityKey = "", segmentKey = "", linkKey = "", options = {}) {
    const source = options.source || "api";
    if (source === "hover" && pinnedHighlight) return;
    const nextEntity = String(entityKey || "");
    const nextSegment = String(segmentKey || "");
    const nextLink = String(linkKey || "");
    if (
      highlightedEntityKey === nextEntity
      && highlightedSegmentKey === nextSegment
      && highlightedEntityLinkKey === nextLink
    ) return;
    highlightedEntityKey = nextEntity;
    highlightedSegmentKey = nextSegment;
    highlightedEntityLinkKey = nextLink;
    applyDOMHighlight();
    applyMapHighlight();
  }

  function clearPinned() {
    pinnedHighlight = null;
    setHighlightedEntity("", "", "", { source: "pin" });
  }

  function applyDOMHighlight(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    const targets = root.querySelectorAll(interactiveSelector);
    const hasHighlight = Boolean(highlightedEntityKey || highlightedSegmentKey || highlightedEntityLinkKey);
    targets.forEach((element) => {
      const entityKey = element.dataset.entityKey || "";
      const segmentKey = element.dataset.segmentKey || "";
      const entityLink = element.dataset.entityLink || "";
      const active = (highlightedEntityKey && entityKey === highlightedEntityKey)
        || (highlightedSegmentKey && segmentKey === highlightedSegmentKey)
        || (highlightedEntityLinkKey && entityLink === highlightedEntityLinkKey);
      element.classList.toggle("highlight-active", Boolean(active));
      element.classList.toggle("highlight-dim", hasHighlight && !active);
      element.classList.toggle("highlight-pinned", Boolean(active && pinnedHighlight));
    });
  }

  function registerMapLayer(layer, {
    entityKeys = [],
    segmentKeys = [],
    linkKeys = [],
    baseStyle = null,
    enableHover = true,
  } = {}) {
    if (!layer) return;
    const normalizedEntity = entityKeys.filter(Boolean);
    const normalizedSegment = segmentKeys.filter(Boolean);
    const normalizedLinks = linkKeys.filter(Boolean);

    mapHighlightEntries.push({
      layer,
      entityKeys: new Set(normalizedEntity),
      segmentKeys: new Set(normalizedSegment),
      linkKeys: new Set(normalizedLinks),
      baseStyle,
    });

    if (enableHover && (normalizedEntity.length || normalizedSegment.length || normalizedLinks.length) && typeof layer.on === "function") {
      layer.on("mouseover", () => {
        setHighlightedEntity(normalizedEntity[0] || "", normalizedSegment[0] || "", normalizedLinks[0] || "", { source: "hover" });
      });
      layer.on("mouseout", () => {
        setHighlightedEntity("", "", "", { source: "hover" });
      });
      layer.on("click", () => {
        if (!pinningEnabled) return;
        const nextEntity = normalizedEntity[0] || "";
        const nextSegment = normalizedSegment[0] || "";
        const nextLink = normalizedLinks[0] || "";
        const isSameAsPinned = Boolean(
          pinnedHighlight
          && pinnedHighlight.entityKey === nextEntity
          && pinnedHighlight.segmentKey === nextSegment
          && pinnedHighlight.linkKey === nextLink
        );
        if (isSameAsPinned) {
          clearPinned();
          return;
        }
        pinnedHighlight = { entityKey: nextEntity, segmentKey: nextSegment, linkKey: nextLink };
        setHighlightedEntity(nextEntity, nextSegment, nextLink, { source: "pin" });
      });
    }
  }

  function applyMapHighlight() {
    const hasHighlight = Boolean(highlightedEntityKey || highlightedSegmentKey || highlightedEntityLinkKey);
    mapHighlightEntries.forEach((entry) => {
      const isActive = (highlightedEntityKey && entry.entityKeys.has(highlightedEntityKey))
        || (highlightedSegmentKey && entry.segmentKeys.has(highlightedSegmentKey))
        || (highlightedEntityLinkKey && entry.linkKeys.has(highlightedEntityLinkKey));

      if (typeof entry.layer.setStyle === "function" && entry.baseStyle) {
        if (!hasHighlight) {
          entry.layer.setStyle(entry.baseStyle);
        } else if (isActive) {
          const activeStyle = { ...entry.baseStyle };
          if (Number.isFinite(activeStyle.weight)) activeStyle.weight += 1.8;
          if (Number.isFinite(activeStyle.radius)) activeStyle.radius += 2;
          if (Number.isFinite(activeStyle.opacity)) activeStyle.opacity = Math.min(1, activeStyle.opacity + 0.2);
          if (Number.isFinite(activeStyle.fillOpacity)) activeStyle.fillOpacity = Math.min(1, activeStyle.fillOpacity + 0.2);
          entry.layer.setStyle(activeStyle);
          if (typeof entry.layer.bringToFront === "function") entry.layer.bringToFront();
        } else {
          const dimStyle = { ...entry.baseStyle };
          if (Number.isFinite(dimStyle.weight)) dimStyle.weight = Math.max(1, dimStyle.weight * 0.7);
          if (Number.isFinite(dimStyle.opacity)) dimStyle.opacity = Math.max(0.12, dimStyle.opacity * 0.25);
          if (Number.isFinite(dimStyle.fillOpacity)) dimStyle.fillOpacity = Math.max(0.12, dimStyle.fillOpacity * 0.25);
          entry.layer.setStyle(dimStyle);
        }
      }

      const layerElement = typeof entry.layer.getElement === "function" ? entry.layer.getElement() : null;
      if (layerElement) {
        layerElement.classList.toggle("map-highlight-active", hasHighlight && Boolean(isActive));
        layerElement.classList.toggle("map-highlight-dim", hasHighlight && !isActive);
      }
    });
  }

  function resetMapEntries() {
    mapHighlightEntries = [];
  }

  function setPinningEnabled(enabled) {
    pinningEnabled = Boolean(enabled);
    if (!pinningEnabled && pinnedHighlight) {
      clearPinned();
    } else {
      applyDOMHighlight();
    }
  }

  return {
    bindRoot,
    setHighlightedEntity,
    clearPinned,
    setPinningEnabled,
    applyDOMHighlight,
    registerMapLayer,
    applyMapHighlight,
    resetMapEntries,
  };
}
